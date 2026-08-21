import { BrowserWindow } from 'electron'
import { takeScreenshot } from './automationService'
import { getProvider } from '../ai'
import type { AIProviderId } from '../../src/types/settings'

export interface ObservationConfig {
  intervalMs: number
  model: string
  provider: AIProviderId
  apiKey: string
  customBaseUrl?: string
}

let observationTimer: ReturnType<typeof setInterval> | null = null
let currentConfig: ObservationConfig | null = null
let targetWindow: BrowserWindow | null = null
let analysisCount = 0

const ANALYSIS_PROMPT = `Eres un asistente de visión por computadora. Acabas de recibir un screenshot de la pantalla del usuario.

Describe brevemente qué ves en pantalla:
- Qué aplicación o página web está abierta
- Qué contenido es visible (textos, botones, imágenes importantes)
- Si hay algo que parezca requerir atención (errores, ventanas emergentes, etc.)

Sé conciso. Máximo 3-4 líneas. Responde en español.`

async function performAnalysis(): Promise<void> {
  if (!targetWindow || targetWindow.isDestroyed() || !currentConfig) {
    stopObservation()
    return
  }

  try {
    console.log(`[Orion] Observation: captura #${analysisCount + 1}`)
    const screenshotBase64 = await takeScreenshot()

    const provider = getProvider(currentConfig.provider)
    if (!provider) {
      console.error('[Orion] Observation: proveedor no encontrado')
      return
    }

    const messages = [
      { role: 'user' as const, content: ANALYSIS_PROMPT, images: [{ mimeType: 'image/jpeg', base64Data: screenshotBase64 }] },
    ]

    if (!provider.chatWithTools) {
      console.warn('[Orion] Observation: proveedor no soporta chatWithTools, usando streamChat')
      return
    }

    const result = await provider.chatWithTools({
      messages,
      settings: {
        provider: currentConfig.provider,
        model: currentConfig.model,
        temperature: 0.3,
        maxTokens: 300,
        systemPrompt: '',
        customBaseUrl: currentConfig.customBaseUrl ?? '',
      },
      apiKey: currentConfig.apiKey,
      signal: AbortSignal.timeout(30000),
      onChunk: () => {},
      tools: [],
    })

    analysisCount++

    if (result?.text && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send('observation:analysis', {
        text: result.text,
        timestamp: Date.now(),
      })
    }
  } catch (err) {
    console.error('[Orion] Observation error:', err)
  }
}

export function startObservation(window: BrowserWindow, config: ObservationConfig): boolean {
  if (observationTimer) {
    stopObservation()
  }

  targetWindow = window
  currentConfig = config
  analysisCount = 0

  console.log(`[Orion] Observation started: every ${config.intervalMs}ms`)

  // First capture immediately
  void performAnalysis()

  observationTimer = setInterval(() => {
    void performAnalysis()
  }, config.intervalMs)

  return true
}

export function stopObservation(): boolean {
  if (observationTimer) {
    clearInterval(observationTimer)
    observationTimer = null
  }
  currentConfig = null
  targetWindow = null
  analysisCount = 0
  console.log('[Orion] Observation stopped')
  return true
}

export function getObservationStatus(): { active: boolean; intervalMs: number } {
  return {
    active: observationTimer !== null,
    intervalMs: currentConfig?.intervalMs ?? 0,
  }
}
