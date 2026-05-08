import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  onSpeak?: (text: string) => void;
}

export function ChatMessage({ message, onSpeak }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      aria-label={isUser ? "我说的话" : "助手回答"}
    >
      <div
        className={`max-w-[88%] rounded-[1.4rem] px-5 py-4 text-[1rem] leading-8 shadow-sm ${
          isUser
            ? "rounded-br-md bg-[#126145] text-white"
            : "rounded-bl-md border border-[#d9cbb4] bg-white text-[#1f2933]"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[0.88rem] font-bold opacity-85">{isUser ? "我说的话" : "助手回答"}</p>
          {!isUser && onSpeak ? (
            <button
              type="button"
              onClick={() => onSpeak(message.content)}
              className="flex min-h-11 items-center gap-2 rounded-full border border-[#126145] bg-[#f1f9f4] px-4 text-[0.92rem] font-bold leading-none text-[#126145]"
              aria-label="播放这条助手回答的语音"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                aria-hidden="true"
              >
                <path d="M4 10v4h4l5 4V6l-5 4H4z" fill="currentColor" stroke="none" />
                <path d="M16 9.5a4 4 0 0 1 0 5" strokeLinecap="round" />
                <path d="M18.5 7a7.5 7.5 0 0 1 0 10" strokeLinecap="round" />
              </svg>
              播放语音
            </button>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </article>
  );
}
