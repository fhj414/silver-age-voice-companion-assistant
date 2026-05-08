import type { ApiChatMessage, ChatRole } from "@/types/chat";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openrouter/owl-alpha";

export const seniorCompanionSystemPrompt = `
你是“银龄语音陪伴助手”，主要陪伴老年人。
请像贴心的儿女一样说话：亲切、体谅、有温度，让老人感觉被惦记、被陪伴。
请用中文普通话习惯表达，语气温和、耐心、简短，默认控制在150字以内。
可以适量使用温暖的语气词和少量表情符号，但不要堆砌表情。
不要吓唬老人，不要制造焦虑。
生活问题要给清楚、可执行的小步骤。
如果老人问手机使用方法，请一步一步教，每一步都短。
涉及疾病、用药、急救、诊断时，只能提供一般常识，必须提醒咨询医生；如有胸痛、呼吸困难、昏迷、大出血等紧急情况，提醒立即拨打当地急救电话。
不要提供诈骗、违法、危险、自伤伤人、医疗诊断或高风险结论。
如果无法确定，请诚实说明，并建议找家人、医生或相关工作人员确认。
`.trim();

interface OpenRouterChoice {
  message?: {
    role?: ChatRole;
    content?: string;
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: {
    message?: string;
    code?: string;
  };
}

function getConfiguredModels(): string[] {
  const primaryModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbackModels = (process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return Array.from(new Set([primaryModel, ...fallbackModels]));
}

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export class OpenRouterError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
    this.code = code;
  }
}

export async function requestOpenRouter(messages: ApiChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const models = getConfiguredModels();

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  let lastError: OpenRouterError | null = null;

  for (const model of models) {
    try {
      return await requestOpenRouterModel(apiKey, model, messages);
    } catch (error) {
      if (!(error instanceof OpenRouterError)) {
        throw error;
      }

      lastError = error;
      const canTryNextModel = error.status === 400 || error.status === 403 || error.status === 404;

      if (!canTryNextModel) {
        throw error;
      }

      console.warn("OpenRouter model failed, trying fallback if available:", {
        model,
        status: error.status,
        code: error.code,
        message: error.message
      });
    }
  }

  throw lastError || new Error("OpenRouter request failed");
}

async function requestOpenRouterModel(
  apiKey: string,
  model: string,
  messages: ApiChatMessage[]
): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getSiteUrl(),
      "X-Title": "Silver Age Voice Companion Assistant"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: seniorCompanionSystemPrompt
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  let data: OpenRouterResponse | null = null;

  try {
    data = (await response.json()) as OpenRouterResponse;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new OpenRouterError(
      data?.error?.message || "OpenRouter request failed",
      response.status,
      data?.error?.code
    );
  }

  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }

  return content;
}
