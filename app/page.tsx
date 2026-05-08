"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { SpeechControls } from "@/components/SpeechControls";
import { VoiceButton } from "@/components/VoiceButton";
import {
  createChineseSpeechRecognition,
  getSpeechSupport,
  speakChineseText,
  stopSpeaking,
  warmUpSpeechVoices
} from "@/lib/speech";
import type { ApiChatMessage, ChatMessage as ChatMessageType, ChatResponseBody } from "@/types/chat";

const STORAGE_KEY = "silver-age-chat-history";
const AUTO_SPEAK_KEY = "silver-age-auto-speak";
const SENIOR_MODE_KEY = "silver-age-senior-mode";

const quickQuestions = ["今天吃什么？", "帮我看看这是不是诈骗", "教我怎么用微信", "陪我聊聊天"];

function createMessage(role: ChatMessageType["role"], content: string): ChatMessageType {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString()
  };
}

function toApiMessages(messages: ChatMessageType[]): ApiChatMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content
  }));
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [seniorMode, setSeniorMode] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  const recognitionRef = useRef<ReturnType<typeof createChineseSpeechRecognition>>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages]
  );

  useEffect(() => {
    const support = getSpeechSupport();
    setSpeechRecognitionSupported(support.recognition);
    const cleanupSpeechVoices = warmUpSpeechVoices();

    const savedMessages = window.localStorage.getItem(STORAGE_KEY);
    const savedAutoSpeak = window.localStorage.getItem(AUTO_SPEAK_KEY);
    const savedSeniorMode = window.localStorage.getItem(SENIOR_MODE_KEY);

    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages) as ChatMessageType[];
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (savedAutoSpeak) {
      setAutoSpeak(savedAutoSpeak === "true");
    }

    if (savedSeniorMode) {
      setSeniorMode(savedSeniorMode === "true");
    }

    return cleanupSpeechVoices;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("senior-mode", seniorMode);
    window.localStorage.setItem(SENIOR_MODE_KEY, String(seniorMode));
  }, [seniorMode]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    window.localStorage.setItem(AUTO_SPEAK_KEY, String(autoSpeak));
  }, [autoSpeak]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  async function sendMessage(content: string) {
    const trimmedContent = content.trim();

    if (!trimmedContent || isThinking) {
      return;
    }

    setError("");
    setTranscript("");
    setInputText("");
    setIsThinking(true);
    stopSpeaking();
    setIsSpeaking(false);

    const userMessage = createMessage("user", trimmedContent);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: toApiMessages(nextMessages)
        })
      });

      const data = (await response.json()) as Partial<ChatResponseBody> & { error?: string };

      if (!response.ok || !data.message?.content) {
        throw new Error(data.error || "网络有点慢，请再试一次。");
      }

      const assistantMessage = createMessage("assistant", data.message.content);
      setMessages((currentMessages) => [...currentMessages, assistantMessage]);

      if (autoSpeak) {
        speakAssistantText(assistantMessage.content);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "网络有点慢，请再试一次。");
    } finally {
      setIsThinking(false);
    }
  }

  function startListening() {
    setError("");
    setTranscript("");

    const recognition = createChineseSpeechRecognition({
      onResult: (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text) {
          recognitionRef.current?.stop();
          void sendMessage(text);
        }
      },
      onError: (message) => {
        setError(message);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (!recognition) {
      setSpeechRecognitionSupported(false);
      setError("当前浏览器不支持语音识别，您可以直接打字。");
      return;
    }

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("刚才没有打开麦克风，请再试一次，或直接打字。");
      setIsListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);

    if (transcript.trim()) {
      void sendMessage(transcript);
    }
  }

  function handleTextSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(inputText);
  }

  function speakAssistantText(text: string) {
    speakChineseText(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setError("朗读遇到一点问题，文字还可以正常查看。")
    });
  }

  function handleReplay() {
    if (!lastAssistantMessage) {
      return;
    }

    speakAssistantText(lastAssistantMessage.content);
  }

  function handleClearMessages() {
    stopSpeaking();
    setMessages([]);
    setTranscript("");
    setError("");
    setIsSpeaking(false);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col bg-[#fffaf0] text-[#1f2933]">
      <header className="sticky top-0 z-20 border-b border-[#d9cbb4] bg-[#fffaf0]/95 px-5 py-5 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.55rem] font-black leading-tight text-[#12352a]">
              您好，我是您的语音陪伴助手
            </h1>
            <p className="mt-3 text-[1rem] leading-8 text-[#45545f]">
              可以问我天气、健康常识、做饭、手机使用、生活问题，也可以和我聊天
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSeniorMode((value) => !value)}
            className="min-h-14 shrink-0 rounded-full border-2 border-[#126145] bg-white px-4 text-[0.95rem] font-bold text-[#126145]"
            aria-pressed={seniorMode}
          >
            老年模式
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-5 pb-[25rem] pt-5" aria-live="polite">
        <div className="space-y-4">
          <SpeechControls
            autoSpeak={autoSpeak}
            isSpeaking={isSpeaking}
            canReplay={Boolean(lastAssistantMessage)}
            onToggleAutoSpeak={() => setAutoSpeak((value) => !value)}
            onStopSpeaking={() => {
              stopSpeaking();
              setIsSpeaking(false);
            }}
            onReplay={handleReplay}
          />

          <div className="grid grid-cols-2 gap-3">
            {quickQuestions.map((question) => (
              <button
                type="button"
                key={question}
                onClick={() => void sendMessage(question)}
                disabled={isThinking}
                className="min-h-16 rounded-[1.1rem] border border-[#d9cbb4] bg-white px-4 text-left text-[1rem] font-bold leading-7 text-[#12352a] shadow-sm disabled:opacity-60"
              >
                {question}
              </button>
            ))}
          </div>

          {messages.length === 0 ? (
            <div className="rounded-[1.4rem] border border-[#d9cbb4] bg-white p-5 text-[1rem] leading-8 text-[#45545f] shadow-sm">
              您可以点“开始说话”，也可以在下面打字。我会尽量说得简单、慢一点。
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} onSpeak={speakAssistantText} />
              ))}
            </div>
          )}

          {isThinking ? (
            <div className="rounded-[1.2rem] border border-[#d9cbb4] bg-[#fff3d9] px-5 py-4 text-[1rem] font-bold text-[#5b4630]">
              正在思考，请稍等
            </div>
          ) : null}

          <div ref={chatEndRef} />
        </div>
      </section>

      <footer className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[720px] border-t border-[#d9cbb4] bg-[#fffaf0]/95 px-5 pt-4 shadow-[0_-8px_24px_rgba(31,41,51,0.08)] backdrop-blur">
        <div className="space-y-3">
          <VoiceButton
            isListening={isListening}
            disabled={isThinking}
            unsupported={!speechRecognitionSupported}
            onStart={startListening}
            onStop={stopListening}
          />

          {transcript ? (
            <div className="rounded-[1rem] border border-[#d9cbb4] bg-white px-4 py-3 text-[1rem] leading-7 text-[#1f2933]">
              识别到：{transcript}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[1rem] bg-[#fff3d9] px-4 py-3 text-[1rem] font-bold leading-7 text-[#9f2607]">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleTextSubmit} className="space-y-3">
            <label htmlFor="text-input" className="sr-only">
              文字输入
            </label>
            <textarea
              id="text-input"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="也可以在这里输入文字"
              rows={2}
              className="w-full resize-none rounded-[1.1rem] border-2 border-[#d9cbb4] bg-white px-4 py-3 text-[1rem] leading-7 text-[#1f2933] outline-none focus:border-[#126145]"
            />
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <button
                type="submit"
                disabled={isThinking || !inputText.trim()}
                className="min-h-16 rounded-[1.1rem] bg-[#126145] px-5 text-[1.05rem] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#c8b8a0] disabled:text-[#655d52]"
              >
                发送文字
              </button>
              <button
                type="button"
                onClick={handleClearMessages}
                className="min-h-16 rounded-[1.1rem] border-2 border-[#b93815] bg-white px-4 text-[1rem] font-bold text-[#b93815]"
              >
                清空
              </button>
            </div>
          </form>
        </div>
      </footer>
    </main>
  );
}
