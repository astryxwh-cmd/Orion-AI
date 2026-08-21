import { History } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function HistoryPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Historial"
        description="Registro de actividad, comandos ejecutados y herramientas usadas por Orion."
      />
      <div className="flex-1">
        <EmptyState
          icon={History}
          title="Sin actividad registrada todavía"
          description="Cuando Orion ejecute acciones con tu permiso, aparecerán aquí para que siempre sepas qué ha hecho en tu equipo."
          footnote="El registro de actividad se implementa junto con el sistema de herramientas."
        />
      </div>
    </div>
  )
}