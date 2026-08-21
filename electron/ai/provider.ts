import type { AIChatRequestMessage, AISettingsPayload } from '../../src/types/ai'
import type { ToolDefinition } from './tools'

export interface AIStreamRequest {
  messages: AIChatRequestMessage[]
  settings: AISettingsPayload
  apiKey: string
  signal: AbortSignal
  onChunk: (text: string) => void
  tools?: ToolDefinition[]
}

export interface AIToolCall {
  name: string
  args: Record<string, unknown>
  thoughtSignature?: string
}

export interface AIProvider {
  readonly id: string
  streamChat(request: AIStreamRequest): Promise<void>
  streamChatWithTools?(request: AIStreamRequest, onToolCall: (toolCall: AIToolCall) => void): Promise<AIToolCall[] | null>
  chatWithTools?(request: AIStreamRequest): Promise<{ text: string; toolCalls: AIToolCall[] | null }>
}