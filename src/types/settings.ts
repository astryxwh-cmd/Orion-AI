export type AIProviderId = 'gemini' | 'openai' | 'openrouter' | 'custom'

export interface AISettings {
  provider: AIProviderId | ''
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  customBaseUrl: string
}

export interface AppearanceSettings {
  theme: 'dark'
  transparency: boolean
  animations: boolean
}

export interface AutomationSettings {
  mouseSpeed: number
  typingSpeed: number
  actionDelayMs: number
  confirmations: boolean
}

export interface ShortcutSettings {
  emergencyStop: string
  newConversation: string
  toggleVisibility: string
}

export interface ObservationSettings {
  enabled: boolean
  intervalMs: number
}

export interface AppSettings {
  ai: AISettings
  appearance: AppearanceSettings
  automation: AutomationSettings
  shortcuts: ShortcutSettings
  observation: ObservationSettings
}