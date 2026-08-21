import { create } from 'zustand'

export type ToastKind = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  description?: string
}

interface UiStoreState {
  toasts: ToastItem[]
  addToast: (kind: ToastKind, title: string, description?: string) => void
  dismissToast: (id: number) => void
}

let toastCounter = 0
const TOAST_DURATION_MS = 4200

export const useUiStore = create<UiStoreState>()((set) => ({
  toasts: [],

  addToast: (kind, title, description) => {
    toastCounter += 1
    const id = toastCounter
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, kind, title, description }],
    }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
    }, TOAST_DURATION_MS)
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))