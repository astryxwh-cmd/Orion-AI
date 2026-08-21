import type { BrowserWindow } from 'electron'
import type {
  AIChatPayload,
  AIChatRequestMessage,
  AIImageContent,
  AISettingsPayload,
  StreamChunkEvent,
  StreamEndEvent,
  StreamErrorEvent,
} from '../../src/types/ai'
import { getProvider } from '../ai'
import { createStreamId, formatErrorMessage } from '../ai/streaming-utils'
import { ORION_TOOLS } from '../ai/tools'
import { getSecret } from './secretsService'
import { executeTool, type ToolCall } from './toolExecutor'

interface ActiveStream {
  abortController: AbortController
}

const activeStreams = new Map<string, ActiveStream>()

const AI_STREAM_CHANNEL = 'ai:stream'
const AI_ERROR_CHANNEL = 'ai:error'
const AI_END_CHANNEL = 'ai:end'
const AI_TOOL_CHANNEL = 'ai:tool'

const MAX_TOOL_ROUNDS = 15

export function startAiStream(eventSender: BrowserWindow, payload: AIChatPayload): string {
  const { provider: providerId, model, temperature, maxTokens, systemPrompt, customBaseUrl } =
    payload.settings

  if (!providerId) {
    throw new Error('Selecciona un proveedor de IA en Configuración.')
  }
  if (!model.trim()) {
    throw new Error('Indica el modelo de IA en Configuración.')
  }

  const apiKey = getSecret('ai.apiKey')
  if (!apiKey) {
    throw new Error('No hay API key configurada. Añádela en Configuración → Inteligencia Artificial.')
  }

  const provider = getProvider(providerId, customBaseUrl)
  if (!provider) {
    throw new Error(
      providerId === 'custom'
        ? 'Indica la URL base de tu proveedor compatible en Configuración.'
        : 'El proveedor de IA seleccionado no está disponible.',
    )
  }

  const streamId = createStreamId()
  const abortController = new AbortController()
  activeStreams.set(streamId, { abortController })

  const webContents = eventSender.webContents

  void runToolLoop(
    provider,
    payload.messages,
    {
      provider: providerId,
      model: model.trim(),
      temperature,
      maxTokens,
      systemPrompt,
      customBaseUrl,
    },
    apiKey,
    abortController.signal,
    webContents,
    streamId,
  )
    .then(() => {
      activeStreams.delete(streamId)
      if (webContents.isDestroyed()) return
      webContents.send(AI_END_CHANNEL, { streamId } satisfies StreamEndEvent)
    })
    .catch((error: unknown) => {
      activeStreams.delete(streamId)
      if (webContents.isDestroyed()) return
      if (abortController.signal.aborted) {
        webContents.send(AI_END_CHANNEL, { streamId } satisfies StreamEndEvent)
        return
      }
      webContents.send(AI_ERROR_CHANNEL, {
        streamId,
        message: formatErrorMessage(error),
      } satisfies StreamErrorEvent)
    })

  return streamId
}

interface ToolResultWithImage {
  name: string
  args: Record<string, unknown>
  result: string
  image?: AIImageContent
  thoughtSignature?: string
}

async function runToolLoop(
  provider: ReturnType<typeof getProvider> & object,
  initialMessages: AIChatRequestMessage[],
  settings: AISettingsPayload,
  apiKey: string,
  signal: AbortSignal,
  webContents: import('electron').WebContents,
  streamId: string,
): Promise<void> {
  let messages = [...initialMessages]
  let round = 0

  while (round < MAX_TOOL_ROUNDS && !signal.aborted) {
    round++

    const toolCallsThisRound: Array<{ name: string; args: Record<string, unknown>; thoughtSignature?: string }> = []
    let streamedText = ''

    const hasImages = messages.some((m) => m.images && m.images.length > 0)

    if (hasImages) {
      console.log('[Orion] Image round detected, sending without tools')
      await provider.streamChat({
        messages,
        settings,
        apiKey,
        signal,
        onChunk: (text: string) => {
          if (webContents.isDestroyed()) return
          streamedText += text
          webContents.send(AI_STREAM_CHANNEL, { streamId, text } satisfies StreamChunkEvent)
        },
      })
      return
    } else if (provider.streamChatWithTools) {
      const returnedToolCalls = await provider.streamChatWithTools(
        {
          messages,
          settings,
          apiKey,
          signal,
          onChunk: (text: string) => {
            if (webContents.isDestroyed()) return
            streamedText += text
            webContents.send(AI_STREAM_CHANNEL, { streamId, text } satisfies StreamChunkEvent)
          },
          tools: ORION_TOOLS,
        },
        (toolCall) => {
          const existing = toolCallsThisRound.find(
            (t) => t.name === toolCall.name && JSON.stringify(t.args) === JSON.stringify(toolCall.args),
          )
          if (existing) {
            if (toolCall.thoughtSignature && !existing.thoughtSignature) {
              existing.thoughtSignature = toolCall.thoughtSignature
            }
          } else {
            toolCallsThisRound.push(toolCall)
          }
        },
      )

      if (returnedToolCalls && returnedToolCalls.length > 0) {
        for (const tc of returnedToolCalls) {
          const existing = toolCallsThisRound.find(
            (t) => t.name === tc.name && JSON.stringify(t.args) === JSON.stringify(tc.args),
          )
          if (existing) {
            if (tc.thoughtSignature && !existing.thoughtSignature) {
              existing.thoughtSignature = tc.thoughtSignature
            }
          } else {
            toolCallsThisRound.push(tc)
          }
        }
      }
    } else {
      await provider.streamChat({
        messages,
        settings,
        apiKey,
        signal,
        onChunk: (text: string) => {
          if (webContents.isDestroyed()) return
          webContents.send(AI_STREAM_CHANNEL, { streamId, text } satisfies StreamChunkEvent)
        },
        tools: ORION_TOOLS,
      })
      return
    }

    if (toolCallsThisRound.length === 0) {
      return
    }

    const toolResults: ToolResultWithImage[] = []

    for (const toolCall of toolCallsThisRound) {
      if (signal.aborted) return

      if (!webContents.isDestroyed()) {
        webContents.send(AI_TOOL_CHANNEL, {
          streamId,
          toolName: toolCall.name,
          args: toolCall.args,
        })
      }

      const result = await executeTool(toolCall as ToolCall)
      const toolResult: ToolResultWithImage = {
        name: toolCall.name,
        args: toolCall.args,
        result: result.result,
        thoughtSignature: toolCall.thoughtSignature,
      }

      if (result.image) {
        toolResult.image = {
          mimeType: 'image/jpeg',
          base64Data: result.image,
        }
      }

      toolResults.push(toolResult)

      if (!webContents.isDestroyed()) {
        const displayText = result.image
          ? `\n\n[Herramienta: ${toolCall.name}] Screenshot capturado y enviado a la IA para análisis.\n`
          : `\n\n[Herramienta: ${toolCall.name}] ${result.result.slice(0, 500)}${result.result.length > 500 ? '...' : ''}\n`
        webContents.send(AI_STREAM_CHANNEL, {
          streamId,
          text: displayText,
        } satisfies StreamChunkEvent)
      }
    }

    const assistantMessage: AIChatRequestMessage = {
      role: 'assistant',
      content: streamedText,
      functionCalls: toolResults.map((tr) => ({
        name: tr.name,
        args: tr.args,
        thoughtSignature: tr.thoughtSignature,
      })),
    }

    const imageResults = toolResults.filter((tr) => tr.image)

    const toolResponseMessage: AIChatRequestMessage = {
      role: 'user',
      content: imageResults.length > 0 ? 'He capturado una imagen de la pantalla. Analiza lo que ves en ella.' : '',
      functionResponses: toolResults.map((tr) => ({
        name: tr.name,
        response: { result: tr.result.slice(0, 2000) },
      })),
    }

    if (imageResults.length > 0) {
      toolResponseMessage.images = imageResults.map((tr) => tr.image!)
    }

    messages = [
      ...messages,
      assistantMessage,
      toolResponseMessage,
    ]
  }
}

export function cancelAiStream(streamId: string): boolean {
  const stream = activeStreams.get(streamId)
  if (!stream) {
    return false
  }
  stream.abortController.abort()
  activeStreams.delete(streamId)
  return true
}

export function cancelAllAiStreams(): void {
  for (const { abortController } of activeStreams.values()) {
    abortController.abort()
  }
  activeStreams.clear()
}

export const AI_EVENTS = {
  stream: AI_STREAM_CHANNEL,
  error: AI_ERROR_CHANNEL,
  end: AI_END_CHANNEL,
  tool: AI_TOOL_CHANNEL,
} as const
