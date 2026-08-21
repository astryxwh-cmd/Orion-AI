export type AIChatRole = 'user' | 'assistant' | 'system' | 'model'

export interface AIImageContent {
  mimeType: string
  base64Data: string
}

export interface AIFunctionCall {
  name: string
  args: Record<string, unknown>
  thoughtSignature?: string
}

export interface AIFunctionResponse {
  name: string
  response: Record<string, unknown>
  thoughtSignature?: string
}

export interface AIChatRequestMessage {
  role: AIChatRole
  content: string
  images?: AIImageContent[]
  functionCalls?: AIFunctionCall[]
  functionResponses?: AIFunctionResponse[]
}

export interface AISettingsPayload {
  provider: 'gemini' | 'openai' | 'openrouter' | 'custom' | ''
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  customBaseUrl?: string
}

export interface AIChatPayload {
  messages: AIChatRequestMessage[]
  settings: AISettingsPayload
}

export interface StreamChunkEvent {
  streamId: string
  text: string
}

export interface StreamEndEvent {
  streamId: string
}

export interface StreamErrorEvent {
  streamId: string
  message: string
}

export interface StreamToolEvent {
  streamId: string
  toolName: string
  args: Record<string, unknown>
}