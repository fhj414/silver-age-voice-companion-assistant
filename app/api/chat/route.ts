import { NextResponse } from "next/server";
import { OpenRouterError, requestOpenRouter } from "@/lib/openrouter";
import type { ChatRequestBody, ChatResponseBody, ChatErrorBody } from "@/types/chat";

export const runtime = "nodejs";

function isValidMessage(value: unknown): value is ChatRequestBody["messages"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChatRequestBody>;
    const messages = Array.isArray(body.messages) ? body.messages.filter(isValidMessage) : [];

    if (messages.length === 0) {
      return NextResponse.json<ChatErrorBody>(
        { error: "请先说一句话，或输入想问的问题。" },
        { status: 400 }
      );
    }

    const answer = await requestOpenRouter(messages.slice(-12));

    return NextResponse.json<ChatResponseBody>({
      message: {
        role: "assistant",
        content: answer
      }
    });
  } catch (error) {
    console.error("Chat API failed:", error);

    if (error instanceof OpenRouterError) {
      const isModelOrProviderError =
        error.status === 400 ||
        error.status === 403 ||
        error.message.toLowerCase().includes("provider") ||
        error.message.toLowerCase().includes("model");

      return NextResponse.json<ChatErrorBody>(
        {
          error: isModelOrProviderError
            ? "助手现在暂时连不上，请稍后再试。"
            : "网络有点慢，请再试一次。"
        },
        { status: 502 }
      );
    }

    return NextResponse.json<ChatErrorBody>(
      { error: "网络有点慢，请再试一次。" },
      { status: 500 }
    );
  }
}
