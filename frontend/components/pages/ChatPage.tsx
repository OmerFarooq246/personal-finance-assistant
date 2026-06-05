"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { listChatMessages, listChatSessions, sendChatMessage } from "@/lib/api/chat";
import { cn, shortDate } from "@/lib/finance";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import type { ChatMessage } from "@/lib/types";

export function ChatPage() {
  const loadSessions = useCallback(() => listChatSessions(), []);
  const { data: sessions, error: sessionsError, loading: sessionsLoading, reload: reloadSessions } = useAsyncData(loadSessions);
  const chatSessions = useMemo(() => sessions ?? [], [sessions]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const resolvedActiveSessionId = activeSessionId ?? chatSessions[0]?.id ?? null;
  const activeSession = chatSessions.find((session) => session.id === resolvedActiveSessionId) ?? null;

  useEffect(() => {
    if (!resolvedActiveSessionId) {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setMessagesLoading(true);
      setMessagesError(null);
      listChatMessages(resolvedActiveSessionId)
        .then((loadedMessages) => {
          if (active) setMessages(loadedMessages);
        })
        .catch((caught) => {
          if (active) setMessagesError(caught instanceof Error ? caught.message : "Could not load chat messages.");
        })
        .finally(() => {
          if (active) setMessagesLoading(false);
        });
    });

    return () => {
      active = false;
    };
  }, [resolvedActiveSessionId]);

  const sessionMessages = useMemo(
    () => messages.filter((message) => message.session_id === resolvedActiveSessionId).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)),
    [resolvedActiveSessionId, messages],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    const sessionId = resolvedActiveSessionId ?? createSixDigitSessionId(chatSessions.map((session) => session.id));
    if (!resolvedActiveSessionId) setActiveSessionId(sessionId);
    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: Date.now(),
      session_id: sessionId,
      role: "USER",
      content: value,
      metadata_json: null,
      created_at: now,
      updated_at: now,
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setTyping(true);
    try {
      const response = await sendChatMessage({ chat_session_id: sessionId, chat_msg: value });
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        session_id: sessionId,
        role: "ASSISTANT",
        content: response,
        metadata_json: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMessages((current) => [...current, assistantMessage]);
      await reloadSessions();
    } catch (caught) {
      setMessagesError(caught instanceof Error ? caught.message : "Could not send chat message.");
    } finally {
      setTyping(false);
    }
  }

  function startNewChat() {
    setActiveSessionId(createSixDigitSessionId(chatSessions.map((session) => session.id)));
    setMessages([]);
    setTyping(false);
    setMessagesError(null);
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="hidden h-full w-72 flex-col border-r border-outline-variant bg-surface-container-lowest lg:flex">
        <div className="border-b border-outline-variant p-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant py-2 transition-colors hover:bg-surface-container-low" onClick={startNewChat}>
            <MaterialIcon name="add" />
            <span>New Chat</span>
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          <div className="px-3 py-2 label-md text-on-surface-variant">Recent</div>
          {sessionsLoading ? <div className="px-3 py-2 text-sm text-on-surface-variant">Loading sessions...</div> : null}
          {sessionsError ? <div className="px-3 py-2 text-sm text-error">{sessionsError}</div> : null}
          {chatSessions.map((session) => {
            const latest = messages
              .filter((message) => message.session_id === session.id)
              .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
            return (
              <button
                className={cn("w-full rounded-lg p-3 text-left transition-colors hover:bg-surface-container-low", session.id === resolvedActiveSessionId && "bg-surface-container-low")}
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setTyping(false);
                }}
              >
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="truncate pr-2 font-medium text-on-surface">{session.title}</span>
                  <span className="label-md whitespace-nowrap text-on-surface-variant">{shortDate(session.updated_at)}</span>
                </div>
                <p className="truncate label-md text-on-surface-variant">{latest?.content}</p>
              </button>
            );
          })}
          {!sessionsLoading && !sessionsError && chatSessions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-on-surface-variant">No chat sessions yet.</div>
          ) : null}
        </div>
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col bg-surface-bright">
        <div className="border-b border-outline-variant bg-surface p-3 lg:hidden">
          <span className="font-medium text-on-surface">{activeSession?.title ?? "New Chat"}</span>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-3 pb-28 md:p-5">
          <div className="flex justify-center">
            <span className="rounded-full bg-surface-container-low px-3 py-1 label-md text-on-surface-variant">Today</span>
          </div>
          {messagesLoading ? <div className="text-center text-on-surface-variant">Loading messages...</div> : null}
          {messagesError ? <div className="rounded-lg border border-error/30 bg-error-container p-3 text-error">{messagesError}</div> : null}
          {sessionMessages.map((message, index) => (
            <MessageBubble key={`${message.id}-${index}`} message={message} />
          ))}
          {!messagesLoading && !messagesError && sessionMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-on-surface-variant">
              Ask a question to start a finance chat.
            </div>
          ) : null}
          {typing ? <TypingIndicator /> : null}
        </div>

        <div className="border-t border-outline-variant bg-surface p-3 pb-24 md:pb-4">
          <form className="mx-auto max-w-3xl" onSubmit={onSubmit}>
            <div className="relative flex items-center rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <input
                className="w-full border-none bg-transparent py-2.5 pl-4 pr-12 text-on-surface outline-none placeholder:text-on-surface-variant"
                placeholder="Ask about your finances..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button className="absolute right-2 flex items-center justify-center rounded-lg p-2 text-primary transition-colors hover:bg-surface-container" aria-label="Send message">
                <MaterialIcon name="send" filled />
              </button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-center label-md text-on-surface-variant">
              <MaterialIcon name="info" className="text-[14px]" />
              Upload files in Transactions or Receipts to analyze them here.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "USER") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-container px-3 py-2.5 md:max-w-[70%]">
          <p className="text-on-surface">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-start gap-3">
      <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
        <MaterialIcon name="smart_toy" className="text-[18px] text-on-primary-container" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-outline-variant bg-surface-container-lowest px-3 py-2.5 shadow-sm md:max-w-[70%]">
        <p className="text-on-surface">{message.content}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end justify-start gap-3">
      <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
        <MaterialIcon name="smart_toy" className="text-[18px] text-on-primary-container" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-outline-variant bg-surface-container-lowest px-3 py-2.5">
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-outline-variant" />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-outline-variant [animation-delay:150ms]" />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-outline-variant [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function createSixDigitSessionId(existingIds: number[]) {
  const usedIds = new Set(existingIds);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = Math.floor(100000 + Math.random() * 900000);
    if (!usedIds.has(id)) return id;
  }
  return Math.floor(Math.random() * 999999) + 1;
}
