interface VoiceButtonProps {
  isListening: boolean;
  disabled?: boolean;
  unsupported?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function VoiceButton({
  isListening,
  disabled = false,
  unsupported = false,
  onStart,
  onStop
}: VoiceButtonProps) {
  if (unsupported) {
    return (
      <div className="rounded-[1.2rem] border border-[#d9cbb4] bg-[#fff3d9] p-4 text-[1rem] leading-7 text-[#5b4630]">
        当前浏览器不支持语音识别，您可以直接在下方输入文字。
      </div>
    );
  }

  return (
    <button
      type="button"
      onPointerDown={(event) => {
        if (disabled || isListening) {
          return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        onStart();
      }}
      onPointerUp={(event) => {
        if (!isListening) {
          return;
        }

        event.currentTarget.releasePointerCapture(event.pointerId);
        onStop();
      }}
      onPointerCancel={onStop}
      onKeyDown={(event) => {
        if (disabled || isListening || (event.key !== " " && event.key !== "Enter")) {
          return;
        }

        event.preventDefault();
        onStart();
      }}
      onKeyUp={(event) => {
        if (!isListening || (event.key !== " " && event.key !== "Enter")) {
          return;
        }

        event.preventDefault();
        onStop();
      }}
      onContextMenu={(event) => event.preventDefault()}
      disabled={disabled}
      className={`flex min-h-20 w-full select-none touch-none items-center justify-center gap-3 rounded-[1.4rem] px-6 text-[1.25rem] font-bold text-white shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#c8b8a0] ${
        isListening ? "bg-[#b93815]" : "bg-[#126145]"
      }`}
      aria-pressed={isListening}
      aria-label={isListening ? "松开发送语音" : "按住说话"}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20" aria-hidden="true">
        {isListening ? (
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M6 5h12v14H6z" fill="currentColor" stroke="none" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M4 10v4h4l5 4V6l-5 4H4z" fill="currentColor" stroke="none" />
            <path d="M16 9.5a4 4 0 0 1 0 5" strokeLinecap="round" />
            <path d="M18.5 7a7.5 7.5 0 0 1 0 10" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span>{isListening ? "松开发送" : "按住说话"}</span>
    </button>
  );
}
