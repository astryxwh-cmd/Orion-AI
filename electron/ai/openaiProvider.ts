import { parseSseStream } from './streaming-utils'
import type { AIProvider, AIToolCall } from './provider'
import type { AIChatRequestMessage } from '../../src/types/ai'

const OPENAI_API_BASE = 'https://api.openai.com/v1'

function createOpenAICompatibleProvider(
  id: 'openai' | 'openrouter' | 'custom',
  baseUrl: string,
  displayName: string,
): AIProvider {
  return {
    id,

    async streamChat({ messages, settings, apiKey, signal, onChunk }): Promise<void> {
      if (!settings.model) {
        throw new Error('Indica el modelo en Configuración (ej: gpt-4o-mini).')
      }

      const url = `${baseUrl}/chat/completions`
      const requestMessages = buildOpenAICompatibleMessages(messages, settings.systemPrompt)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: requestMessages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
        }),
        signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`La API de ${displayName} respondió ${response.status}: ${errorText.slice(0, 200)}`)
      }

      await parseSseStream(response.body, {
        providerId: id,
        onText: onChunk,
      })
    },

    async streamChatWithTools(
      { messages, settings, apiKey, signal, onChunk, tools },
      onToolCall,
    ): Promise<AIToolCall[] | null> {
      if (!settings.model) {
        throw new Error('Indica el modelo en Configuración.')
      }

      if (!tools || tools.length === 0) {
        await this.streamChat({ messages, settings, apiKey, signal, onChunk })
        return null
      }

      const url = `${baseUrl}/chat/completions`
      const requestMessages = buildOpenAICompatibleMessages(messages, settings.systemPrompt)
      const openaiTools = tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }))

      console.log(`[${displayName}] Sending request with ${openaiTools.length} tools`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: requestMessages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          tools: openaiTools,
          stream: true,
        }),
        signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error(`[${displayName}] API error:`, response.status, errorText.slice(0, 500))
        throw new Error(`La API de ${displayName} respondió ${response.status}: ${errorText.slice(0, 200)}`)
      }

      const toolCalls = await parseOpenAIStreamWithToolCalls(response.body, {
        providerId: id,
        onText: onChunk,
        onToolCall,
      })

      console.log(`[${displayName}] Tool calls received:`, toolCalls.length)
      return toolCalls.length > 0 ? toolCalls : null
    },
  }
}

type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | OpenAIContentPart[]
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>
  tool_call_id?: string
}

function buildOpenAICompatibleMessages(
  messages: AIChatRequestMessage[],
  systemPrompt: string,
): OpenAIMessage[] {
  const result: OpenAIMessage[] = []
  if (systemPrompt.trim().length > 0) {
    result.push({ role: 'system', content: systemPrompt })
  }

  let toolCallIndex = 0

  for (const message of messages) {
    const role = message.role === 'model' ? 'assistant' : message.role

    if (role === 'system') {
      result.push({ role: 'system', content: message.content })
      continue
    }

    if (role === 'assistant') {
      if (message.functionCalls && message.functionCalls.length > 0) {
        const toolCalls = message.functionCalls.map((fc) => {
          toolCallIndex++
          return {
            id: `call_${toolCallIndex}`,
            type: 'function' as const,
            function: {
              name: fc.name,
              arguments: JSON.stringify(fc.args),
            },
          }
        })
        result.push({
          role: 'assistant',
          content: message.content || '',
          tool_calls: toolCalls,
        })
      } else {
        result.push({ role: 'assistant', content: message.content })
      }
      continue
    }

    if (role === 'user') {
      if (message.functionResponses && message.functionResponses.length > 0) {
        for (const fr of message.functionResponses) {
          result.push({
            role: 'tool',
            content: JSON.stringify(fr.response),
            tool_call_id: `call_${++toolCallIndex}`,
          })
        }
      }

      if (message.images && message.images.length > 0) {
        const parts: OpenAIContentPart[] = []
        if (message.content) {
          parts.push({ type: 'text', text: message.content })
        }
        for (const image of message.images) {
          parts.push({
            type: 'image_url',
            image_url: { url: `data:${image.mimeType};base64,${image.base64Data}` },
          })
        }
        result.push({ role: 'user', content: parts })
      } else if (message.content) {
        result.push({ role: 'user', content: message.content })
      }
    }
  }

  return result
}

export const openaiProvider = createOpenAICompatibleProvider(
  'openai',
  OPENAI_API_BASE,
  'OpenAI',
)

export const openrouterProvider = createOpenAICompatibleProvider(
  'openrouter',
  'https://openrouter.ai/api/v1',
  'OpenRouter',
)

export function createCustomProvider(baseUrl: string): AIProvider {
  return createOpenAICompatibleProvider('custom', baseUrl, 'tu proveedor')
}

interface ToolCallDelta {
  index: number
  id?: string
  function?: { name?: string; arguments?: string }
}

const activeToolCalls = new Map<number, { id: string; name: string; arguments: string }>()

async function parseOpenAIStreamWithToolCalls(
  body: ReadableStream<Uint8Array> | null,
  options: {
    providerId: string
    onText: (text: string) => void
    onToolCall: (toolCall: AIToolCall) => void
  },
): Promise<AIToolCall[]> {
  if (!body) {
    throw new Error('El proveedor no devolvió un cuerpo de respuesta.')
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const toolCalls: AIToolCall[] = []

  activeToolCalls.clear()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trimStart()
        if (data === '[DONE]') break

        try {
          const json = JSON.parse(data) as Record<string, unknown>
          const choices = json.choices as Array<{
            delta?: {
              content?: string
              tool_calls?: ToolCallDelta[]
            }
          }> | undefined

          const delta = choices?.[0]?.delta
          if (!delta) continue

          if (delta.content) {
            options.onText(delta.content)
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (!activeToolCalls.has(tc.index)) {
                activeToolCalls.set(tc.index, { id: tc.id || `call_${tc.index}`, name: '', arguments: '' })
              }
              const existing = activeToolCalls.get(tc.index)!
              if (tc.id) existing.id = tc.id
              if (tc.function?.name) existing.name += tc.function.name
              if (tc.function?.arguments) existing.arguments += tc.function.arguments
            }
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  for (const [, tc] of activeToolCalls) {
    if (tc.name) {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.arguments)
      } catch {
        // keep empty args
      }
      const toolCall: AIToolCall = { name: tc.name, args }
      toolCalls.push(toolCall)
      options.onToolCall(toolCall)
    }
  }

  activeToolCalls.clear()
  return toolCalls
}