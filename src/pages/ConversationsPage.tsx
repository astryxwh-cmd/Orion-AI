import { useEffect, useMemo } from 'react'
import { ChevronRight, MessageSquare, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { useChatStore } from '@/stores/chatStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useSystemStore } from '@/stores/systemStore'
import { useUiStore } from '@/stores/uiStore'
import type { ChatMessage } from '@/types/chat'
import { cn } from '@/utils/cn'

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60_000) {
    return 'Hace un momento'
  }
  if (diff < 3_600_000) {
    return `Hace ${Math.floor(diff / 60_000)} min`
  }
  if (diff < 86_400_000) {
    return `Hace ${Math.floor(diff / 3_600_000)} h`
  }
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function messagePreview(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1]
  if (!last) {
    return 'Sin mensajes'
  }
  return last.content.length > 80 ? `${last.content.slice(0, 80)}…` : last.content
}

export function ConversationsPage() {
  const conversations = useConversationStore((state) => state.conversations)
  const searchQuery = useConversationStore((state) => state.searchQuery)
  const setSearchQuery = useConversationStore((state) => state.setSearchQuery)
  const openConversation = useConversationStore((state) => state.openConversation)
  const deleteConversation = useConversationStore((state) => state.deleteConversation)
  const renameConversation = useConversationStore((state) => state.renameConversation)
  const refresh = useConversationStore((state) => state.refresh)
  const activeId = useConversationStore((state) => state.activeConversationId)
  const loadConversation = useChatStore((state) => state.loadConversation)
  const setView = useSystemStore((state) => state.setView)
  const addToast = useUiStore((state) => state.addToast)

  const filtered = useMemo(() => {
    if (searchQuery.trim().length === 0) {
      return conversations
    }
    const query = searchQuery.toLowerCase()
    return conversations.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(query) ||
        conversation.messages.some((message) =>
          message.content.toLowerCase().includes(query),
        ),
    )
  }, [conversations, searchQuery])

  const handleOpen = async (id: string): Promise<void> => {
    const conversation = await openConversation(id)
    if (conversation) {
      loadConversation(conversation)
      setView('chat')
    }
  }

  const handleNew = async (): Promise<void> => {
    const created = await useConversationStore.getState().createConversation()
    loadConversation(created)
    setView('chat')
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (
      window.confirm('¿Eliminar esta conversación? No se podrá deshacer.')
    ) {
      await deleteConversation(id)
      addToast('info', 'Conversación eliminada')
    }
  }

  const handleRename = async (id: string): Promise<void> => {
    const conversation = conversations.find((item) => item.id === id)
    if (!conversation) {
      return
    }
    const title = window.prompt('Nuevo nombre de la conversación:', conversation.title)
    if (title !== null && title.trim().length > 0) {
      await renameConversation(id, title.trim())
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Conversaciones"
        description="Reanuda, renombra o elimina tus chats con Orion."
        action={
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus size={15} />}
            onClick={handleNew}
          >
            Nueva conversación
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar conversaciones..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/60"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              {searchQuery.trim().length > 0
                ? 'No se encontraron conversaciones.'
                : 'Aún no hay conversaciones. ¡Crea una nueva!'}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleOpen(conversation.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    activeId === conversation.id
                      ? 'bg-zinc-800/80'
                      : 'hover:bg-zinc-800/40',
                  )}
                >
                  <MessageSquare size={16} className="shrink-0 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-zinc-200">
                        {conversation.title}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {formatDate(conversation.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {messagePreview(conversation.messages)}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-zinc-600 opacity-0 group-hover:opacity-60"
                  />
                  <div className="ml-1 flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleRename(conversation.id)
                      }}
                      className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700/60 hover:text-zinc-200"
                      title="Renombrar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleDelete(conversation.id)
                      }}
                      className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700/60 hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}