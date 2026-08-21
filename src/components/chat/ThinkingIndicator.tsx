import { Bot } from 'lucide-react'

export function ThinkingIndicator() {
  return (
    <div className="flex animate-fade-in items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 shadow-md shadow-violet-950/40">
        <Bot size={16} className="text-white" strokeWidth={2.2} />
      </div>
      <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:300ms]" />
      </div>
    </div>
  )
}