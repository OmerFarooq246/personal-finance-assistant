import { AppShell } from "@/components/layout/AppShell";
import { ChatPage } from "@/components/pages/ChatPage";

export default function ChatRoute() {
  return (
    <AppShell chatMode>
      <ChatPage />
    </AppShell>
  );
}

