import { randomUUID } from 'node:crypto'

export function createStreamId(): string {
  return `stream-${Date.now()}-${randomUUID().slice(0, 8)}`
}

interface ParseSseStreamOptions {
  providerId: string
  onText: (text: string) => void
}

/**
 * Lee un cuerpo SSE línea a línea y ejecuta onText por cada fragmento.
 * Lanza un error descriptivo si la consulta devuelve una respuesta inválida.
 */
export async function parseSseStream(
  body: ReadableStream<Uint8Array> | null,
  { providerId, onText }: ParseSseStreamOptions,
): Promise<void> {
  if (!body) {
    throw new Error('El proveedor no devolvió un cuerpo de respuesta.')
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) {
          continue
        }
        const data = trimmed.slice(5).trimStart()

        if (data === '[DONE]') {
          return
        }
        const text = extractTextFromChunk(providerId, data)
        if (text) {
          onText(text)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function extractToolCallsFromChunk(
  providerId: string,
  data: string,
): Array<{ name: string; args: Record<string, unknown> }> | null {
  if (!data) return null

  try {
    const json = JSON.parse(data) as Record<string, unknown>

    if (providerId === 'gemini') {
      const candidates = json.candidates as
        | Array<{ content?: { parts?: Array<{ functionCall?: { name: string; args: Record<string, unknown> } }> } }>
        | undefined
      const parts = candidates?.[0]?.content?.parts
      if (!parts) return null

      const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = []
      for (const part of parts) {
        if (part.functionCall) {
          toolCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args,
          })
        }
      }
      return toolCalls.length > 0 ? toolCalls : null
    }

    if (providerId === 'openai' || providerId === 'custom') {
      const choices = json.choices as
        | Array<{ delta?: { tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> } }>
        | undefined
      const toolCalls = choices?.[0]?.delta?.tool_calls
      if (!toolCalls) return null

      return toolCalls
        .filter((tc) => tc.function?.name)
        .map((tc) => ({
          name: tc.function!.name!,
          args: tc.function?.arguments ? JSON.parse(tc.function.arguments) as Record<string, unknown> : {},
        }))
    }
  } catch {
    return null
  }
  return null
}

function extractTextFromChunk(providerId: string, data: string): string | null {
  if (!data) {
    return null
  }
  try {
    const json = JSON.parse(data) as Record<string, unknown>

    if (providerId === 'gemini') {
      const candidates = json.candidates as
        | Array<{ content?: { parts?: Array<{ text?: string }> } }>
        | undefined
      return candidates?.[0]?.content?.parts?.[0]?.text ?? null
    }

    if (providerId === 'openai' || providerId === 'custom') {
      const choices = json.choices as
        | Array<{ delta?: { content?: string }; message?: { content?: string } }>
        | undefined
      const delta = choices?.[0]?.delta?.content
      const message = choices?.[0]?.message?.content
      return delta ?? message ?? null
    }
  } catch {
    return null
  }
  return null
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}