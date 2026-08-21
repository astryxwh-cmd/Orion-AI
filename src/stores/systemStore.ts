import { create } from 'zustand'
import { useUiStore } from '@/stores/uiStore'

export type ViewKey =
  | 'chat'
  | 'conversations'
  | 'automations'
  | 'tools'
  | 'history'
  | 'connections'
  | 'settings'

export type OrionStatus = 'idle' | 'thinking' | 'working' | 'stopped' | 'error'

interface SystemStoreState {
  view: ViewKey
  orionStatus: OrionStatus
  isMaximized: boolean
  appVersion: string
  setView: (view: ViewKey) => void
  setOrionStatus: (status: OrionStatus) => void
  setIsMaximized: (maximized: boolean) => void
  setAppVersion: (version: string) => void
  triggerEmergencyStop: () => void
}

export const useSystemStore = create<SystemStoreState>()((set) => ({
  view: 'chat',
  orionStatus: 'idle',
  isMaximized: false,
  appVersion: '0.1.0',

  setView: (view) => set({ view }),

  setOrionStatus: (orionStatus) => set({ orionStatus }),

  setIsMaximized: (isMaximized) => set({ isMaximized }),

  setAppVersion: (appVersion) => set({ appVersion }),

  triggerEmergencyStop: () => {
    set({ orionStatus: 'stopped' })
    useUiStore
      .getState()
      .addToast(
        'warning',
        'Parada de emergencia',
        'Se activó Ctrl+Shift+X. Las acciones automatizadas se cancelan al instante.',
      )
  },
}))