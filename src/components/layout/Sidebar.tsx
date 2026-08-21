import { History, MessageSquare, Phone, Plus, Settings, Wrench, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useChatStore } from '@/stores/chatStore'
import { useSystemStore } from '@/stores/systemStore'
import type { ViewKey } from '@/stores/systemStore'
import { cn } from '@/utils/cn'

interface NavItem {
  view: ViewKey
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { view: 'conversations', label: 'Conversaciones', icon: MessageSquare },
  { view: 'automations', label: 'Automatizaciones', icon: Zap },
  { view: 'tools', label: 'Herramientas', icon: Wrench },
  { view: 'history', label: 'Historial', icon: History },
  { view: 'connections', label: 'Celular', icon: Phone },
]

export function Sidebar() {
  const view = useSystemStore((state) => state.view)
  const setView = useSystemStore((state) => state.setView)
  const orionStatus = useSystemStore((state) => state.orionStatus)
  const appVersion = useSystemStore((state) => state.appVersion)
  const newChat = useChatStore((state) => state.newChat)

  const handleNewConversation = (): void => {
    newChat()
    setView('chat')
  }

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r border-zinc-800/70 bg-[#0B0B0D]">
      {/* Cabecera */}
      <div className="flex h-12 items-center border-b border-zinc-800/70 px-4">
        <Logo size="sm" withText />
      </div>

      {/* Nueva conversación */}
      <div className="p-3">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          iconLeft={<Plus size={16} strokeWidth={2.4} />}
          onClick={handleNewConversation}
        >
          Nueva conversación
        </Button>
      </div>

      <p className="px-4 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
        Menú
      </p>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive = view === item.view
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              className={cn(
                'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800/80 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
              )}
            >
              <item.icon
                size={17}
                strokeWidth={2}
                className={isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}
              />
              {item.label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />}
            </button>
          )
        })}
      </nav>

      {/* Pie */}
      <div className="border-t border-zinc-800/70 p-3">
        <button
          type="button"
          onClick={() => setView('settings')}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
            view === 'settings'
              ? 'bg-zinc-800/80 text-white'
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
          )}
        >
          <Settings
            size={17}
            className={view === 'settings' ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}
          />
          Configuración
        </button>
        <div className="mt-2 flex items-center justify-between px-2 pt-1">
          <span className="text-[11px] text-zinc-600">v{appVersion}</span>
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                orionStatus === 'stopped' ? 'bg-red-500' : 'bg-emerald-400',
              )}
            />
            {orionStatus === 'stopped' ? 'Detenido' : 'En línea'}
          </span>
        </div>
      </div>
    </aside>
  )
}