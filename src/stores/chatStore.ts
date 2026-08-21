import { create } from 'zustand'
import type { ChatMessage, Conversation } from '@/types/chat'
import type { AIChatPayload, AIChatRequestMessage } from '@/types/ai'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSystemStore } from '@/stores/systemStore'
import { useUiStore } from '@/stores/uiStore'

let messageCounter = 0

function createMessageId(): string {
  messageCounter += 1
  return `msg-${Date.now()}-${messageCounter}`
}

function toRequestMessages(messages: ChatMessage[]): AIChatRequestMessage[] {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : message.role,
      content: message.content,
      ...(message.images && message.images.length > 0
        ? { images: message.images.map((base64) => ({ mimeType: 'image/jpeg', base64Data: base64 })) }
        : {}),
    }))
}

const PROVIDER_NOT_CONFIGURED_MESSAGE =
  'Todavía no has configurado un proveedor de IA.\n\nVe a Configuración → Inteligencia Artificial: añade tu API key y el modelo, y Orion podrá empezar a responder. La clave se guarda cifrada en tu equipo.'

interface ChatStoreState {
  messages: ChatMessage[]
  isGenerating: boolean
  activeStreamId: string | null
  streamingAssistantId: string | null
  newChat: () => void
  loadConversation: (conversation: Conversation) => void
  addAssistantMessage: (content: string) => void
  addSystemMessage: (content: string) => void
  sendMessage: (content: string, images?: string[]) => Promise<void>
  stopGeneration: () => void
  applyStreamChunk: (streamId: string, text: string) => void
  finishStream: (streamId: string) => Promise<void>
  failStream: (streamId: string, message: string) => void
  subscribeToStreams: () => () => void
}

export const useChatStore = create<ChatStoreState>()((set, get) => ({
  messages: [],
  isGenerating: false,
  activeStreamId: null,
  streamingAssistantId: null,

  newChat: () => {
    set({
      messages: [],
      isGenerating: false,
      activeStreamId: null,
      streamingAssistantId: null,
    })
    useSystemStore.getState().setOrionStatus('idle')
    void useConversationStore.getState().createConversation()
  },

  loadConversation: (conversation) => {
    set({
      messages: conversation.messages,
      isGenerating: false,
      activeStreamId: null,
      streamingAssistantId: null,
    })
    useConversationStore.getState().setActive(conversation.id)
  },

  addAssistantMessage: (content) => {
    const message: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content,
      createdAt: Date.now(),
    }
    set((state) => ({ messages: [...state.messages, message] }))
  },

  addSystemMessage: (content) => {
    const message: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: `👁 **Observación:** ${content}`,
      createdAt: Date.now(),
    }
    set((state) => ({ messages: [...state.messages, message] }))
  },

  sendMessage: async (content, images) => {
    const trimmed = content.trim()
    if (trimmed.length === 0 || get().isGenerating) {
      return
    }

    const settings = useSettingsStore.getState().settings
    const hasApiKey = useSettingsStore.getState().hasApiKey
    if (!hasApiKey || !settings.ai.provider) {
      set({ isGenerating: false })
      get().addAssistantMessage(PROVIDER_NOT_CONFIGURED_MESSAGE)
      return
    }

    const conversationStore = useConversationStore.getState()
    let conversationId = conversationStore.activeConversationId
    if (!conversationId) {
      const title = trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed
      const created = await window.orion.conversations.create(title)
      conversationStore.setActive(created.id)
      conversationId = created.id
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
      images: images && images.length > 0 ? images : undefined,
      createdAt: Date.now(),
    }
    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isGenerating: true,
      streamingAssistantId: assistantMessage.id,
    }))
    useSystemStore.getState().setOrionStatus('thinking')

    // Persistir el mensaje del usuario en la conversación.
    const conversation = await window.orion.conversations.get(conversationId)
    if (conversation) {
      conversation.messages.push(userMessage)
      await window.orion.conversations.save(conversation)
    }

    try {
      const payload: AIChatPayload = {
        messages: toRequestMessages([...get().messages, userMessage]),
        settings: {
          provider: settings.ai.provider,
          model: settings.ai.model,
          temperature: settings.ai.temperature,
          maxTokens: settings.ai.maxTokens,
          systemPrompt: settings.ai.systemPrompt,
          customBaseUrl: settings.ai.customBaseUrl,
        },
      }
      const streamId = await window.orion.ai.start(payload)
      set({ activeStreamId: streamId })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      set((state) => ({
        messages: state.messages.map((messageItem) =>
          messageItem.id === assistantMessage.id
            ? { ...messageItem, content: `Error: ${message}` }
            : messageItem,
        ),
        isGenerating: false,
        activeStreamId: null,
        streamingAssistantId: null,
      }))
      useSystemStore.getState().setOrionStatus('error')
      useUiStore.getState().addToast('error', 'Error al iniciar el chat', message)
    }
  },

  stopGeneration: () => {
    const streamId = get().activeStreamId
    if (streamId) {
      void window.orion.ai.cancel(streamId)
    }
    set({ isGenerating: false, activeStreamId: null, streamingAssistantId: null })
    useSystemStore.getState().setOrionStatus('idle')
  },

  applyStreamChunk: (streamId, text) => {
    const state = get()
    if (state.activeStreamId !== streamId || !state.streamingAssistantId) {
      return
    }
    set((current) => ({
      messages: current.messages.map((message) =>
        message.id === current.streamingAssistantId
          ? { ...message, content: message.content + text }
          : message,
      ),
    }))
  },

  finishStream: async (streamId) => {
    const state = get()
    if (state.activeStreamId !== streamId) {
      return
    }
    set({ isGenerating: false, activeStreamId: null, streamingAssistantId: null })
    useSystemStore.getState().setOrionStatus('idle')

    const conversationStore = useConversationStore.getState()
    const conversationId = conversationStore.activeConversationId
    if (!conversationId) {
      return
    }
    const conversation = await window.orion.conversations.get(conversationId)
    if (!conversation) {
      return
    }
    const lastMessage = get().messages[get().messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      conversation.messages.push(lastMessage)
      await window.orion.conversations.save(conversation)
    }
  },

  failStream: (streamId, message) => {
    const state = get()
    if (state.activeStreamId !== streamId) {
      return
    }
    set((current) => ({
      messages: current.messages.map((messageItem) =>
        messageItem.id === current.streamingAssistantId
          ? { ...messageItem, content: `Error: ${message}` }
          : messageItem,
      ),
      isGenerating: false,
      activeStreamId: null,
      streamingAssistantId: null,
    }))
    useSystemStore.getState().setOrionStatus('error')
    useUiStore.getState().addToast('error', 'Error del proveedor de IA', message)
  },

  subscribeToStreams: () => {
    if (!window.orion) {
      return () => {}
    }
    const unsubscribeChunk = window.orion.ai.onStreamChunk((event) => {
      get().applyStreamChunk(event.streamId, event.text)
    })
    const unsubscribeEnd = window.orion.ai.onStreamEnd((event) => {
      void get().finishStream(event.streamId)
    })
    const unsubscribeError = window.orion.ai.onStreamError((event) => {
      get().failStream(event.streamId, event.message)
    })
    const unsubscribeTool = window.orion.ai.onToolEvent(() => {
      useSystemStore.getState().setOrionStatus('working')
    })
    return () => {
      unsubscribeChunk()
      unsubscribeEnd()
      unsubscribeError()
      unsubscribeTool()
    }
  },
}))