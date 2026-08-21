import { parseSseStream } from './streaming-utils'
import type { AIProvider, AIToolCall } from './provider'
import type { AIChatRequestMessage } from '../../src/types/ai'
import type { ToolDefinition } from './tools'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function buildGeminiTools(tools: ToolDefinition[]) {
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    },
  ]
}

function buildMessageParts(message: AIChatRequestMessage) {
  type GeminiPart =
    | { text: string; functionCall?: never; functionResponse?: never; inlineData?: never }
    | { functionCall: { name: string; args: Record<string, unknown> }; text?: never; functionResponse?: never; inlineData?: never }
    | { functionResponse: { name: string; response: Record<string, unknown> }; text?: never; functionCall?: never; inlineData?: never }
    | { inlineData: { mimeType: string; data: string }; text?: never; functionCall?: never; functionResponse?: never }

  const parts: GeminiPart[] = []

  if (message.functionCalls && message.functionCalls.length > 0) {
    for (const fc of message.functionCalls) {
      const fcPart: Record<string, unknown> = {
        functionCall: {
          name: fc.name,
          args: fc.args,
        },
      }
      if (fc.thoughtSignature) {
        console.log('[Gemini] Adding thoughtSignature to outgoing functionCall:', fc.thoughtSignature.slice(0, 50) + '...')
        fcPart.thoughtSignature = fc.thoughtSignature
      } else {
        console.log('[Gemini] WARNING: No thoughtSignature for outgoing functionCall:', fc.name)
      }
      parts.push(fcPart as GeminiPart)
    }
    return parts
  }

  if (message.functionResponses && message.functionResponses.length > 0) {
    if (message.content) {
      parts.push({ text: message.content } as GeminiPart)
    }

    for (const fr of message.functionResponses) {
      const frBody: Record<string, unknown> = {
        name: fr.name,
        response: fr.response,
      }

      parts.push({
        functionResponse: frBody,
      } as GeminiPart)
    }

    if (message.images && message.images.length > 0) {
      for (const image of message.images) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.base64Data,
          },
        } as GeminiPart)
      }
    }

    return parts
  }

  if (message.content) {
    parts.push({ text: message.content } as GeminiPart)
  }

  if (message.images && message.images.length > 0) {
    for (const image of message.images) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64Data,
        },
      })
    }
  }

  return parts
}

function buildRequestBody(
  messages: AIChatRequestMessage[],
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  tools?: ToolDefinition[],
) {
  const body: Record<string, unknown> = {
    system_instruction:
      systemPrompt.trim().length > 0 ? { parts: [{ text: systemPrompt }] } : undefined,
    contents: messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: (message.role === 'assistant' || message.role === 'model') ? 'model' : 'user',
        parts: buildMessageParts(message),
      })),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  }

  if (tools && tools.length > 0) {
    body.tools = buildGeminiTools(tools)
    body.toolConfig = {
      functionCallingConfig: {
        mode: 'AUTO',
      },
    }
  }

  console.log('[Gemini] Request body size:', JSON.stringify(body).length, 'chars')
  console.log('[Gemini] Messages count:', messages.length)
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    const hasImages = m.images && m.images.length > 0
    const hasFuncResponses = m.functionResponses && m.functionResponses.length > 0
    const hasFuncCalls = m.functionCalls && m.functionCalls.length > 0
    console.log(`[Gemini] msg[${i}] role=${m.role} content="${m.content?.slice(0, 80)}" images=${hasImages} funcResponses=${hasFuncResponses} funcCalls=${hasFuncCalls}`)
  }

  const geminiContents = body.contents as Array<{ role: string; parts: unknown[] }>
  for (let i = 0; i < geminiContents.length; i++) {
    const gc = geminiContents[i]
    const partTypes = gc.parts.map((p) => {
      const part = p as Record<string, unknown>
      if (part.functionCall) return 'functionCall'
      if (part.functionResponse) return 'functionResponse'
      if (part.inlineData) return 'inlineData'
      if (part.text) return `text("${String(part.text).slice(0, 30)}")`
      return 'unknown'
    })
    console.log(`[Gemini] gemini[${i}] role=${gc.role} parts=[${partTypes.join(', ')}]`)
  }

  return body
}

export const geminiProvider: AIProvider = {
  id: 'gemini',

  async streamChat({ messages, settings, apiKey, signal, onChunk, tools }): Promise<void> {
    if (!settings.model) {
      throw new Error('Indica el modelo de Gemini en Configuración (ej: gemini-1.5-flash).')
    }

    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(settings.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`
    const bodyValue = buildRequestBody(
      messages,
      settings.systemPrompt,
      settings.temperature,
      settings.maxTokens,
      tools,
    )

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyValue),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const detail = extractGeminiError(errorText)
      throw new Error(`La API de Gemini respondió ${response.status}: ${detail}`)
    }

    await parseSseStream(response.body, {
      providerId: 'gemini',
      onText: onChunk,
    })
  },

  async streamChatWithTools(
    { messages, settings, apiKey, signal, onChunk, tools },
    onToolCall,
  ): Promise<AIToolCall[] | null> {
    if (!settings.model) {
      throw new Error('Indica el modelo de Gemini en Configuración (ej: gemini-1.5-flash).')
    }

    if (!tools || tools.length === 0) {
      await this.streamChat({ messages, settings, apiKey, signal, onChunk })
      return null
    }

    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(settings.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`
    const bodyValue = buildRequestBody(
      messages,
      settings.systemPrompt,
      settings.temperature,
      settings.maxTokens,
      tools,
    )

    console.log('[Gemini] Sending request to:', url.replace(/key=.*/, 'key=REDACTED'))

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyValue),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[Gemini] API error:', response.status, errorText.slice(0, 500))
      const detail = extractGeminiError(errorText)
      throw new Error(`La API de Gemini respondió ${response.status}: ${detail}`)
    }

    console.log('[Gemini] Response OK, parsing SSE stream...')

    const toolCalls = await parseSseStreamWithToolCalls(response.body, {
      providerId: 'gemini',
      onText: onChunk,
      onToolCall,
    })

    console.log('[Gemini] Tool calls received:', toolCalls.length, toolCalls.map((tc) => tc.name))

    return toolCalls.length > 0 ? toolCalls : null
  },

  async chatWithTools(
    { messages, settings, apiKey, signal, tools },
  ): Promise<{ text: string; toolCalls: AIToolCall[] | null }> {
    if (!settings.model) {
      throw new Error('Indica el modelo de Gemini en Configuración.')
    }

    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(apiKey)}`
    const bodyValue = buildRequestBody(
      messages,
      settings.systemPrompt,
      settings.temperature,
      settings.maxTokens,
      tools,
    )

    const bodyStr = JSON.stringify(bodyValue)
    console.log('[Gemini] Non-streaming request body size:', bodyStr.length)

    const geminiContents = bodyValue.contents as Array<{ role: string; parts: unknown[] }>
    for (let i = 0; i < geminiContents.length; i++) {
      const gc = geminiContents[i]
      const partSummary = gc.parts.map((p) => {
        const part = p as Record<string, unknown>
        if (part.functionCall) return `functionCall(${(part.functionCall as Record<string, unknown>).name})`
        if (part.functionResponse) return `functionResponse(${(part.functionResponse as Record<string, unknown>).name})`
        if (part.inlineData) {
          const d = part.inlineData as Record<string, unknown>
          return `inlineData(${d.mimeType}, len=${String(d.data).length})`
        }
        if (part.text) return `text("${String(part.text).slice(0, 40)}")`
        return 'unknown'
      })
      console.log(`[Gemini] body.contents[${i}] role=${gc.role} parts=[${partSummary.join(', ')}]`)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[Gemini] Non-streaming API error:', response.status, errorText.slice(0, 500))
      const detail = extractGeminiError(errorText)
      throw new Error(`La API de Gemini respondió ${response.status}: ${detail}`)
    }

    const json = await response.json() as Record<string, unknown>
    const candidates = json.candidates as
      | Array<{ content?: { parts?: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> }; thoughtSignature?: string }> } }>
      | undefined
    const parts = candidates?.[0]?.content?.parts ?? []

    let text = ''
    const toolCalls: AIToolCall[] = []

    for (const part of parts) {
      if (part.text) {
        text += part.text
      }
      if (part.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args,
          thoughtSignature: part.thoughtSignature,
        })
      }
    }

    console.log('[Gemini] Non-streaming response text:', text.slice(0, 300))
    console.log('[Gemini] Non-streaming response toolCalls:', toolCalls.length)

    return { text, toolCalls: toolCalls.length > 0 ? toolCalls : null }
  },
}

async function parseSseStreamWithToolCalls(
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
        if (data === '[DONE]') return toolCalls

        try {
          const json = JSON.parse(data) as Record<string, unknown>
          const candidates = json.candidates as
            | Array<{ content?: { parts?: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> }; thoughtSignature?: string }> } }>
            | undefined
          const parts = candidates?.[0]?.content?.parts
          if (!parts) continue

          for (const part of parts) {
            if (part.text) {
              options.onText(part.text)
            }
            if (part.functionCall) {
              const existing = toolCalls.find(
                (tc) => tc.name === part.functionCall!.name && JSON.stringify(tc.args) === JSON.stringify(part.functionCall!.args),
              )
              if (existing) {
                if (part.thoughtSignature && !existing.thoughtSignature) {
                  existing.thoughtSignature = part.thoughtSignature
                  console.log('[Gemini] Updated thoughtSignature for:', existing.name)
                }
              } else {
                const toolCall: AIToolCall = {
                  name: part.functionCall.name,
                  args: part.functionCall.args,
                  thoughtSignature: part.thoughtSignature,
                }
                console.log('[Gemini] New tool call:', toolCall.name, 'thoughtSignature:', toolCall.thoughtSignature ? toolCall.thoughtSignature.slice(0, 50) + '...' : 'NONE')
                toolCalls.push(toolCall)
                options.onToolCall(toolCall)
              }
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

  return toolCalls
}

function extractGeminiError(rawError: string): string {
  try {
    const json = JSON.parse(rawError) as {
      error?: { message?: string }
    }
    return json.error?.message ?? rawError.slice(0, 200)
  } catch {
    return rawError.slice(0, 200)
  }
}
