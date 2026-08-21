import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AISettings,
  AppSettings,
  AppearanceSettings,
  AutomationSettings,
  ObservationSettings,
  ShortcutSettings,
} from '@/types/settings'

const SETTINGS_STORAGE_KEY = 'orion-settings'

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt:
      'Eres Orion AI, un asistente de escritorio inteligente con control total sobre la computadora del usuario. Puedes:\n\n• Controlar el mouse: mover el cursor, hacer click (izquierdo/derecho/doble), scroll\n• Controlar el teclado: escribir texto, presionar teclas y combinaciones (Ctrl+C, Alt+Tab, etc.)\n• Ver la pantalla: capturar screenshots para analizar qué hay en pantalla\n• Gestionar archivos: leer, escribir, listar directorios, verificar existencia\n• Ejecutar comandos del sistema: comandos de terminal, abrir aplicaciones, URLs y carpetas\n\nREGLA ABSOLUTA: Responde SIEMPRE y EXCLUSIVAMENTE en español. NUNCA uses inglés. Incluso si el código de error o los nombres de archivos están en inglés, tu respuesta debe estar completamente en español. Sé claro, preciso y conciso. Cuando el usuario te pida hacer algo en la computadora, usa las herramientas disponibles para ejecutarlo directamente. Si necesitas ver la pantalla para completar una tarea, captura un screenshot primero.',
    customBaseUrl: '',
  },
  appearance: {
    theme: 'dark',
    transparency: false,
    animations: true,
  },
  automation: {
    mouseSpeed: 3,
    typingSpeed: 3,
    actionDelayMs: 250,
    confirmations: true,
  },
  shortcuts: {
    emergencyStop: 'Ctrl+Shift+X',
    newConversation: 'Ctrl+N',
    toggleVisibility: 'Ctrl+Alt+O',
  },
  observation: {
    enabled: false,
    intervalMs: 10000,
  },
}

interface SettingsStoreState {
  settings: AppSettings
  apiKeyLoaded: boolean
  hasApiKey: boolean
  updateSettings: (partial: Partial<AppSettings>) => void
  updateAI: (partial: Partial<AISettings>) => void
  updateAppearance: (partial: Partial<AppearanceSettings>) => void
  updateAutomation: (partial: Partial<AutomationSettings>) => void
  updateShortcuts: (partial: Partial<ShortcutSettings>) => void
  updateObservation: (partial: Partial<ObservationSettings>) => void
  loadApiKey: () => Promise<void>
  saveApiKey: (apiKey: string) => Promise<void>
  clearApiKey: () => Promise<void>
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      apiKeyLoaded: false,
      hasApiKey: false,

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      updateAI: (ai) =>
        set((state) => ({
          settings: { ...state.settings, ai: { ...state.settings.ai, ...ai } },
        })),

      updateAppearance: (appearance) =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: { ...state.settings.appearance, ...appearance },
          },
        })),

      updateAutomation: (automation) =>
        set((state) => {
          const newAutomation = { ...state.settings.automation, ...automation }
          if (window.orion?.automation) {
            void window.orion.automation.setConfig({
              mouseSpeed: newAutomation.mouseSpeed,
              typingSpeed: newAutomation.typingSpeed,
              actionDelayMs: newAutomation.actionDelayMs,
            })
          }
          return {
            settings: {
              ...state.settings,
              automation: newAutomation,
            },
          }
        }),

      updateShortcuts: (shortcuts) =>
        set((state) => ({
          settings: {
            ...state.settings,
            shortcuts: { ...state.settings.shortcuts, ...shortcuts },
          },
        })),

      updateObservation: (observation) =>
        set((state) => ({
          settings: {
            ...state.settings,
            observation: { ...state.settings.observation, ...observation },
          },
        })),

      loadApiKey: async () => {
        try {
          const api = window.orion
          const key = api ? await api.secrets.get('ai.apiKey') : null
          set({
            hasApiKey: key !== null && key.length > 0,
            apiKeyLoaded: true,
          })
          if (api?.automation) {
            const state = get()
            void api.automation.setConfig({
              mouseSpeed: state.settings.automation.mouseSpeed,
              typingSpeed: state.settings.automation.typingSpeed,
              actionDelayMs: state.settings.automation.actionDelayMs,
            })
          }
        } catch (error) {
          console.error('[orion] No se pudo leer la API key guardada:', error)
          set({ apiKeyLoaded: true, hasApiKey: false })
        }
      },

      saveApiKey: async (apiKey) => {
        const value = apiKey.trim()
        if (value.length === 0) {
          await get().clearApiKey()
          return
        }
        await window.orion.secrets.set('ai.apiKey', value)
        set({ hasApiKey: true })
      },

      clearApiKey: async () => {
        await window.orion.secrets.delete('ai.apiKey')
        set({ hasApiKey: false })
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
)