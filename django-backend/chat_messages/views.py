from pprint import pprint
from django.utils import timezone
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from chat_sessions.models import ChatSession
from llm_calls.chat import llm_call_1, llm_call_2, llm_call_3, suggest_session_title
from llm_calls.schemas import FunctionExecutionResultSchema
from llm_calls.service_functions_docs import SERVICE_FUNCTION_SCHEMAS
from services.service_function_executor import execute_service_function_calls
from .models import ChatMessage, ChatRole
from .serializers import ChatMessageSerializer, ChatRequestSerializer


def _chat_param(request, name: str):
    return request.query_params.get(name) or (request.data.get(name) if isinstance(request.data, dict) else None)


def _make_llm_inputs(chat_history: list[ChatMessage], chat_msg: str) -> tuple[list[dict], list[dict]]:
    try:
        llm_call_1_processed = []
        llm_call_2_processed = []

        if chat_history and len(chat_history) > 1:
            for count, msg in enumerate(chat_history):
                if count < 3:
                    llm_call_1_processed.append(
                        {
                            "role": msg.role,
                            "parts": [{"text": f"timestamp: {msg.created_at}\nmessage: {msg.content}"}],
                        }
                    )

                llm_call_2_processed.append(
                    {
                        "role": msg.role,
                        "parts": [
                            {
                                "text": f"timestamp: {msg.created_at}\nmessage: {msg.content}\nmetadata: {msg.metadata_json}"
                            }
                        ],
                    }
                )

        latest_msg = {
            "role": ChatRole.USER,
            "parts": [{"text": f"timestamp: {timezone.now()}\nmessage: {chat_msg}"}],
        }
        llm_call_1_processed.append(latest_msg)
        llm_call_2_processed.append(latest_msg)

        return llm_call_1_processed, llm_call_2_processed
    except Exception as e:
        print(f"error in make_llm_inputs: {e}")
        raise APIException(f"error in chat input processing: {e}")


def _selected_service_function_docs(groups: list[str] | None) -> list[dict]:
    selected = []
    for group in groups or []:
        if group in SERVICE_FUNCTION_SCHEMAS:
            selected.extend(SERVICE_FUNCTION_SCHEMAS[group])
    return selected


def _save_chat(
    session: ChatSession,
    chat_msg: str,
    final_response: str | None,
    service_results: list[FunctionExecutionResultSchema] | None = None,
) -> None:
    ChatMessage.objects.create(session=session, content=chat_msg, role=ChatRole.USER)
    metadata_json = (
        {"service_results": [service_result.model_dump(mode="json") for service_result in service_results]}
        if service_results
        else None
    )
    ChatMessage.objects.create(
        session=session,
        content=final_response or "",
        role=ChatRole.ASSISTANT,
        metadata_json=metadata_json,
    )


class ChatMessagesView(APIView):
    serializer_class = ChatMessageSerializer

    @extend_schema(responses=ChatMessageSerializer(many=True))
    def get(self, request, chat_session_id: int):
        if not ChatSession.objects.filter(id=chat_session_id, user=request.user).exists():
            raise NotFound(f"Chat session with id={chat_session_id} not found")

        messages = ChatMessage.objects.filter(session_id=chat_session_id).order_by("-created_at")
        limit = request.query_params.get("limit")
        if limit:
            messages = messages[: int(limit)]
        return Response(ChatMessageSerializer(messages, many=True).data)


class ChatView(APIView):
    serializer_class = ChatRequestSerializer

    @extend_schema(request=ChatRequestSerializer, responses=str)
    def post(self, request):
        chat_session_id = _chat_param(request, "chat_session_id")
        chat_msg = _chat_param(request, "chat_msg")
        if not chat_session_id or not chat_msg:
            raise ValidationError("chat_session_id and chat_msg are required")

        chat_session_id = int(chat_session_id)
        session = ChatSession.objects.filter(id=chat_session_id, user=request.user).first()
        if session:
            chat_history = list(ChatMessage.objects.filter(session=session).order_by("-created_at")[:16])
        else:
            session = ChatSession.objects.create(
                id=chat_session_id,
                user=request.user,
                title=suggest_session_title(chat_msg),
            )
            chat_history = []

        try:
            llm_call_1_processed, llm_call_2_processed = _make_llm_inputs(chat_history, chat_msg)
            print("llm_call_1_processed")
            pprint(llm_call_1_processed)
            print()
            print("llm_call_2_processed")
            pprint(llm_call_2_processed)
            print()


            groups = llm_call_1(llm_call_1_processed)
            print(f"groups: {groups}")
            print()

            selected_service_functions = _selected_service_function_docs(groups)

            llm2_response = llm_call_2(llm_call_2_processed, selected_service_functions)
            print("llm2_response")
            pprint(llm2_response)
            print()

            service_results = None

            if llm2_response.answer:
                final_response = llm2_response.answer
            else:
                service_results = execute_service_function_calls(
                    current_user=request.user,
                    function_calls=llm2_response.function_calls,
                )
                print("service_results")
                pprint(service_results)
                print()

                final_response = llm_call_3(llm_call_2_processed, service_results)

            _save_chat(session, chat_msg, final_response, service_results)
            
            print("final_response")
            pprint(final_response)
            return Response(final_response)
        except APIException:
            raise
        except Exception as e:
            print(f"error in chat flow: {e}")
            raise APIException(f"error in chat: {e}")
