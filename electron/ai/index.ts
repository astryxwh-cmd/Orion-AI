import { createCustomProvider, openaiProvider, openrouterProvider } from './openaiProvider'
import { geminiProvider } from './geminiProvider'
import type { AIProvider } from './provider'

const PROVIDERS: AIProvider[] = [geminiProvider, openaiProvider, openrouterProvider]

export function getProvider(providerId: string, customBaseUrl = ''): AIProvider | null {
  if (providerId === 'custom') {
    const base = customBaseUrl.trim()
    if (base.length === 0) {
      return null
    }
    return createCustomProvider(base.replace(/\/+$/, ''))
  }
  return PROVIDERS.find((provider) => provider.id === providerId) ?? null
}

export function isSupportedProvider(providerId: string): providerId is 'gemini' | 'openai' | 'openrouter' | 'custom' {
  return providerId === 'gemini' || providerId === 'openai' || providerId === 'openrouter' || providerId === 'custom'
}