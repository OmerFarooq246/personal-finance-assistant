import { apiRequest } from "./client";
import type { ChatMessage, ChatSession } from "@/lib/types";

export type SendChatRequest = {
  chat_session_id: number;
  chat_msg: string;
};

export function listChatSessions() {
  return apiRequest<ChatSession[]>("/chat-sessions/");
}

export function listChatMessages(chatSessionId: number, limit?: number) {
  const query = limit ? `?limit=${limit}` : "";
  return apiRequest<ChatMessage[]>(`/chat-messages/${chatSessionId}${query}`);
}

export function sendChatMessage(payload: SendChatRequest) {
  return apiRequest<string>("/chat-messages/chat", {
    method: "POST",
    body: payload,
  });
}
