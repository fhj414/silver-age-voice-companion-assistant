export type SpeechSupport = {
  recognition: boolean;
  synthesis: boolean;
};

export type SpeechRecognitionResultCallback = (text: string, isFinal: boolean) => void;
export type SpeechRecognitionErrorCallback = (message: string) => void;
export type SpeechRecognitionEndCallback = () => void;

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function getSpeechSupport(): SpeechSupport {
  if (typeof window === "undefined") {
    return { recognition: false, synthesis: false };
  }

  const speechWindow = window as SpeechWindow;

  return {
    recognition: Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition),
    synthesis: "speechSynthesis" in window
  };
}

export function warmUpSpeechVoices(onReady?: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return () => undefined;
  }

  window.speechSynthesis.getVoices();

  const handleVoicesChanged = () => {
    onReady?.();
  };

  window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

  return () => {
    window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
  };
}

export function createChineseSpeechRecognition(options: {
  onResult: SpeechRecognitionResultCallback;
  onError: SpeechRecognitionErrorCallback;
  onEnd: SpeechRecognitionEndCallback;
}): BrowserSpeechRecognition | null {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as SpeechWindow;
  const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

  if (!Recognition) {
    return null;
  }

  const recognition = new Recognition();
  recognition.lang = "zh-CN";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let text = "";
    let isFinal = false;

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      text += event.results[index][0]?.transcript ?? "";
      if (event.results[index].isFinal) {
        isFinal = true;
      }
    }

    options.onResult(text.trim(), isFinal);
  };

  recognition.onerror = (event) => {
    const friendlyMessage =
      event.error === "not-allowed"
        ? "需要允许浏览器使用麦克风，您也可以直接打字。"
        : "刚才没有听清楚，请再试一次，或直接打字。";

    options.onError(friendlyMessage);
  };

  recognition.onend = options.onEnd;

  return recognition;
}

export function chooseChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const naturalVoiceKeywords = [
    "xiaoxiao",
    "xiaoyi",
    "xiaobei",
    "tingting",
    "mei-jia",
    "meijia",
    "sin-ji",
    "premium",
    "enhanced",
    "natural",
    "neural"
  ];

  return (
    voices
      .map((voice) => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        let score = 0;

        if (lang === "zh-cn") score += 40;
        if (lang.startsWith("zh")) score += 25;
        if (naturalVoiceKeywords.some((keyword) => name.includes(keyword))) score += 20;
        if (voice.localService) score += 5;
        if (name.includes("google")) score -= 3;

        return { voice, score };
      })
      .sort((a, b) => b.score - a.score)[0]?.voice ||
    voices[0] ||
    null
  );
}

export function stripEmojiForSpeech(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{200D}\u{FE0F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function prepareNaturalSpeechText(text: string): string {
  return stripEmojiForSpeech(text)
    .replace(/[。！？]/g, "$& ")
    .replace(/[，、；：]/g, "$& ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function speakChineseText(
  text: string,
  options: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  } = {}
): void {
  const speechText = prepareNaturalSpeechText(text);

  if (typeof window === "undefined" || !("speechSynthesis" in window) || !speechText) {
    options.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(speechText);
  const voice = chooseChineseVoice();

  utterance.lang = voice?.lang || "zh-CN";
  utterance.voice = voice;
  utterance.rate = 0.84;
  utterance.pitch = 1.04;
  utterance.volume = 1;
  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => {
    options.onError?.();
    options.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
