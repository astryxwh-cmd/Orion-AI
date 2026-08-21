import { useEffect } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useSystemStore } from '@/stores/systemStore'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  )
}

/**
 * Atajos globales de Orion. La personalización de combinaciones
 * llegará junto al sistema de atajos de la Fase 4.
 */
export function useOrionShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const ctrl = event.ctrlKey || event.metaKey

      // Nueva conversación: Ctrl+N
      if (ctrl && !event.shiftKey && event.key.toLowerCase() === 'n') {
        if (!isTypingTarget(event.target)) {
          event.preventDefault()
          useSystemStore.getState().setView('chat')
          useChatStore.getState().newChat()
        }
        return
      }

      // Configuración: Ctrl+,
      if (ctrl && event.key === ',') {
        event.preventDefault()
        useSystemStore.getState().setView('settings')
        return
      }

      // Parada de emergencia global: Ctrl+Shift+X
      if (ctrl && event.shiftKey && event.key.toLowerCase() === 'x') {
        event.preventDefault()
        useSystemStore.getState().triggerEmergencyStop()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}