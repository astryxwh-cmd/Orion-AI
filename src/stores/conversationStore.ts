import { create } from 'zustand'
import type { Conversation } from '@/types/chat'

interface ConversationStoreState {
  conversations: Conversation[]
  activeConversationId: string | null
  searchQuery: string
  isLoading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  createConversation: (title?: string) => Promise<Conversation>
  openConversation: (id: string) => Promise<Conversation | null>
  deleteConversation: (id: string) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  setActive: (id: string | null) => void
  setSearchQuery: (query: string) => void
  refresh: () => Promise<void>
}

export const useConversationStore = create<ConversationStoreState>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  searchQuery: '',
  isLoading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) {
      return
    }
    set({ initialized: true, isLoading: true })
    try {
      const list = await window.orion.conversations.list()
      set({ conversations: list })
      if (list.length > 0 && !get().activeConversationId) {
        set({ activeConversationId: list[0].id })
      }
    } catch (error) {
      console.error('[orion] No se pudieron cargar las conversaciones:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  createConversation: async (title) => {
    const created = await window.orion.conversations.create(title ?? '')
    set((state) => ({
      conversations: [created, ...state.conversations],
      activeConversationId: created.id,
    }))
    return created
  },

  openConversation: async (id) => {
    const conversation = await window.orion.conversations.get(id)
    if (conversation) {
      set({ activeConversationId: id })
    }
    return conversation
  },

  deleteConversation: async (id) => {
    await window.orion.conversations.delete(id)
    set((state) => ({
      conversations: state.conversations.filter((conversation) => conversation.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    }))
  },

  renameConversation: async (id, title) => {
    const updated = await window.orion.conversations.rename(id, title)
    if (updated) {
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === id ? updated : conversation,
        ),
      }))
    }
  },

  setActive: (id) => set({ activeConversationId: id }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  refresh: async () => {
    const list = await window.orion.conversations.list()
    set({ conversations: list })
  },
}))