export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Exclude<ChatRole, "system">;
  content: string;
  createdAt: string;
}

export interface ApiChatMessage {
  role: Exclude<ChatRole, "system">;
  content: string;
}

export interface ChatRequestBody {
  messages: ApiChatMessage[];
}

export interface ChatResponseBody {
  message: ApiChatMessage;
}

export interface ChatErrorBody {
  error: string;
}
