import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import type { ToastKind } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const TOAST_STYLES: Record<ToastKind, { icon: typeof Info; box: string; iconColor: string }> = {
  info: { icon: Info, box: 'border-zinc-700 bg-zinc-900/95', iconColor: 'text-violet-400' },
  success: {
    icon: CheckCircle2,
    box: 'border-emerald-700/60 bg-zinc-900/95',
    iconColor: 'text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    box: 'border-amber-700/60 bg-zinc-900/95',
    iconColor: 'text-amber-400',
  },
  error: { icon: XCircle, box: 'border-red-700/60 bg-zinc-900/95', iconColor: 'text-red-400' },
}

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts)
  const dismissToast = useUiStore((state) => state.dismissToast)

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.kind]
        const Icon = style.icon
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 border rounded-xl p-3.5 shadow-xl shadow-black/40 backdrop-blur animate-fade-up',
              style.box,
            )}
          >
            <Icon size={17} className={cn('mt-0.5 shrink-0', style.iconColor)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              className="rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-700/60 hover:text-zinc-200"
              onClick={() => dismissToast(toast.id)}
              aria-label="Cerrar notificación"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}