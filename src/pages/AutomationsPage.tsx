import { Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useUiStore } from '@/stores/uiStore'

const BLUEPRINT_STEPS: readonly string[] = [
  'Abrir VS Code',
  'Abrir el proyecto',
  'Ejecutar npm install',
  'Ejecutar npm run dev',
]

export function AutomationsPage() {
  const addToast = useUiStore((state) => state.addToast)

  const handleCreate = (): void => {
    addToast(
      'info',
      'Creador de automatizaciones',
      'El editor de automatizaciones llegará en una fase próxima.',
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Automatizaciones"
        description="Encadena acciones para que Orion las ejecute por ti."
        action={
          <Button variant="primary" size="sm" iconLeft={<Plus size={15} />} onClick={handleCreate}>
            Crear automatización
          </Button>
        }
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
        <div className="w-full max-w-xl">
          <EmptyState
            icon={Zap}
            title="Automatiza tus tareas repetitivas"
            description="Diseña secuencias de acciones —abrir aplicaciones, escribir, ejecutar comandos— y deja que Orion las haga con tu permiso, una y otra vez."
            footnote="El sistema de automatizaciones se implementa en fases próximas."
          />
        </div>

        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            Ejemplo de flujo
          </p>
          <ol className="mt-4 space-y-1">
            {BLUEPRINT_STEPS.map((step, index) => (
              <li key={step} className="flex items-center gap-3 py-1.5 text-sm text-zinc-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-700/50 bg-violet-950/30 text-[11px] font-semibold text-violet-300">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}