interface SpeechControlsProps {
  autoSpeak: boolean;
  isSpeaking: boolean;
  canReplay: boolean;
  onToggleAutoSpeak: () => void;
  onStopSpeaking: () => void;
  onReplay: () => void;
}

export function SpeechControls({
  autoSpeak,
  isSpeaking,
  canReplay,
  onToggleAutoSpeak,
  onStopSpeaking,
  onReplay
}: SpeechControlsProps) {
  return (
    <section className="rounded-[1.2rem] border border-[#d9cbb4] bg-white p-4 shadow-sm" aria-label="语音开关">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[1rem] font-bold text-[#1f2933]">语音朗读</p>
          <p className="mt-1 text-[0.88rem] leading-6 text-[#52616b]">
            {isSpeaking ? "正在朗读助手回答" : autoSpeak ? "助手回答后会自动读出来" : "已关闭自动朗读"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleAutoSpeak}
          className={`min-h-14 rounded-full px-5 text-[1rem] font-bold text-white ${
            autoSpeak ? "bg-[#126145]" : "bg-[#6b7280]"
          }`}
          aria-pressed={autoSpeak}
        >
          {autoSpeak ? "已开启" : "已关闭"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onStopSpeaking}
          disabled={!isSpeaking}
          className="min-h-16 rounded-[1.1rem] bg-[#b93815] px-4 text-[1rem] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#c8b8a0] disabled:text-[#655d52]"
        >
          停止朗读
        </button>
        <button
          type="button"
          onClick={onReplay}
          disabled={!canReplay}
          className="min-h-16 rounded-[1.1rem] bg-[#244761] px-4 text-[1rem] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#c8b8a0] disabled:text-[#655d52]"
        >
          再读一遍
        </button>
      </div>
    </section>
  );
}
