import { AppWindow, Cpu, FilePen, FileText, FolderOpen, Keyboard, MousePointer2, MousePointerClick, Monitor, Terminal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'

interface ToolEntry {
  name: string
  description: string
  icon: LucideIcon
  category: string
  active: boolean
}

const TOOLS: readonly ToolEntry[] = [
  {
    name: 'get_system_info',
    description: 'Obtiene información del sistema operativo y del hardware.',
    icon: Cpu,
    category: 'Sistema',
    active: true,
  },
  {
    name: 'open_application',
    description: 'Abre aplicaciones o archivos con su programa asociado.',
    icon: AppWindow,
    category: 'Sistema',
    active: true,
  },
  {
    name: 'run_command',
    description: 'Ejecuta un comando en un proceso controlado.',
    icon: Terminal,
    category: 'Sistema',
    active: true,
  },
  {
    name: 'read_file',
    description: 'Lee el contenido de un archivo del equipo.',
    icon: FileText,
    category: 'Archivos',
    active: true,
  },
  {
    name: 'write_file',
    description: 'Escribe o modifica contenido de archivos.',
    icon: FilePen,
    category: 'Archivos',
    active: true,
  },
  {
    name: 'list_directory',
    description: 'Lista el contenido de una carpeta.',
    icon: FolderOpen,
    category: 'Archivos',
    active: true,
  },
  {
    name: 'mouse_move',
    description: 'Mueve el puntero a una posición del escritorio.',
    icon: MousePointer2,
    category: 'Control',
    active: true,
  },
  {
    name: 'mouse_click',
    description: 'Clic izquierdo, derecho o scroll.',
    icon: MousePointerClick,
    category: 'Control',
    active: true,
  },
  {
    name: 'keyboard_type',
    description: 'Escribe texto con la velocidad configurada.',
    icon: Keyboard,
    category: 'Control',
    active: true,
  },
  {
    name: 'keyboard_press',
    description: 'Pulsa teclas y combinaciones especiales.',
    icon: Keyboard,
    category: 'Control',
    active: true,
  },
  {
    name: 'take_screenshot',
    description: 'Captura la pantalla para que Orion pueda verla.',
    icon: Monitor,
    category: 'Control',
    active: true,
  },
]

export function ToolsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Herramientas"
        description="Habilidades que Orion puede usar en tu equipo."
      />

      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
            <p className="text-sm text-emerald-300">
              Las herramientas están activas. Orion puede usarlas automáticamente cuando las necesite.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-violet-400">
                    <tool.icon size={17} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-[13px] font-medium text-zinc-200">
                        {tool.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                        {tool.category}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}