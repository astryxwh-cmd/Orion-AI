import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  footnote?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, footnote, action }: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center text-center animate-fade-up">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 text-violet-400 shadow-lg shadow-black/30">
          <Icon size={26} strokeWidth={1.6} />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
        {footnote && <p className="mt-3 text-xs text-zinc-600">{footnote}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}