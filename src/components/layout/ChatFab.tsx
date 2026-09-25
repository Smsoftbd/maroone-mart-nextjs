import { MessageSquare } from "lucide-react";

/** Round red chat button, bottom right on tablets and up (phones use the tab bar's Chat). */
export function ChatFab({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Chat with us" className="mr-chat-fab">
      <MessageSquare className="h-6 w-6 fill-current" strokeWidth={0} />
    </a>
  );
}
