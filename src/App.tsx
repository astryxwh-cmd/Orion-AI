import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { Toaster } from '@/components/ui/Toaster'
import { useOrionShortcuts } from '@/hooks/useOrionShortcuts'
import { useChatStore } from '@/stores/chatStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSystemStore } from '@/stores/systemStore'
import { AutomationsPage } from '@/pages/AutomationsPage'
import { ChatPage } from '@/pages/ChatPage'
import { ConnectionsPage } from '@/pages/ConnectionsPage'
import { ConversationsPage } from '@/pages/ConversationsPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ToolsPage } from '@/pages/ToolsPage'

export default function App() {
  const view = useSystemStore((state) => state.view)
  const setIsMaximized = useSystemStore((state) => state.setIsMaximized)
  useOrionShortcuts()

  useEffect(() => {
    void useSettingsStore.getState().loadApiKey()
    void window.orion?.app.getVersion().then((version) => {
      useSystemStore.getState().setAppVersion(version)
    })
    void useConversationStore.getState().initialize()
  }, [])

  useEffect(() => {
    const unsubscribe = window.orion?.window.onMaximizedChange((maximized) => {
      useSystemStore.getState().setIsMaximized(maximized)
    })
    void window.orion?.window.isMaximized().then(setIsMaximized)
    return () => {
      unsubscribe?.()
    }
  }, [setIsMaximized])

  useEffect(() => {
    const unsubscribe = useChatStore.getState().subscribeToStreams()
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090B] font-sans text-zinc-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="relative flex-1 overflow-hidden">
          {view === 'chat' && <ChatPage />}
          {view === 'conversations' && <ConversationsPage />}
          {view === 'automations' && <AutomationsPage />}
          {view === 'tools' && <ToolsPage />}
          {view === 'history' && <HistoryPage />}
          {view === 'connections' && <ConnectionsPage />}
          {view === 'settings' && <SettingsPage />}
        </main>
      </div>
      <Toaster />
    </div>
  )
}