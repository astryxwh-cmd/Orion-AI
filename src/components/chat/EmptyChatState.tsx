import { Settings2, Sparkles, Wrench, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useSystemStore } from '@/stores/systemStore'
import type { ViewKey } from '@/stores/systemStore'

const INTRO_MESSAGE =
  'Soy **Orion AI**, tu asistente de escritorio.\n\nEsta es la base funcional de tu asistente. En las próximas fases llegará:\n\n- Conexión con proveedores de IA (Gemini, OpenAI, otros).\n- Herramientas reales para archivos, comandos y terminal.\n- Control de ratón y teclado con permisos.\n- Automatizaciones y tareas repetitivas.\n\nTú dime qué necesitas y vamos construyéndolo.'

interface QuickAction {
  label: string
  icon: LucideIcon
  view?: ViewKey
  intro?: boolean
}

const QUICK_ACTIONS: readonly QuickAction[] = [
  { label: 'Conocer a Orion', icon: Sparkles, intro: true },
  { label: 'Explorar herramientas', icon: Wrench, view: 'tools' },
  { label: 'Crear una automatización', icon: Zap, view: 'automations' },
  { label: 'Configurar mi IA', icon: Settings2, view: 'settings' },
]

export function EmptyChatState() {
  const addAssistantMessage = useChatStore((state) => state.addAssistantMessage)
  const setView = useSystemStore((state) => state.setView)

  const runAction = (action: QuickAction): void => {
    if (action.intro) {
      addAssistantMessage(INTRO_MESSAGE)
      return
    }
    if (action.view) {
      setView(action.view)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center animate-fade-up">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-xl shadow-violet-950/60">
        <Sparkles size={34} className="text-white" strokeWidth={2} />
      </div>

      <h2 className="text-xl font-semibold text-zinc-100">Hola, soy Orion</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
        Tu asistente de escritorio con IA. Conversa conmigo, pídeme tomar el control con seguridad
        y automatiza lo que más repites.
      </p>

      <div className="mt-7 grid w-full max-w-xl grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => runAction(action)}
            className="group flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3.5 py-3 text-left transition-all hover:border-violet-500/40 hover:bg-zinc-900"
          >
            <action.icon
              size={16}
              className="text-zinc-500 transition-colors group-hover:text-violet-400"
            />
            <span className="text-[13px] font-medium text-zinc-300 group-hover:text-white">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}