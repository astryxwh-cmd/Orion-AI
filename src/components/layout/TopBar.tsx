import { ChevronDown, Copy, Eye, EyeOff, Minimize, Settings, Square, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useChatStore } from '@/stores/chatStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSystemStore } from '@/stores/systemStore'
import { useUiStore } from '@/stores/uiStore'
import type { OrionStatus, ViewKey } from '@/stores/systemStore'
import { cn } from '@/utils/cn'

const STATUS_LABELS: Record<OrionStatus, string> = {
  idle: 'Listo',
  thinking: 'Pensando…',
  working: 'Trabajando…',
  stopped: 'Detenido',
  error: 'Error',
}

const STATUS_DOT: Record<OrionStatus, string> = {
  idle: 'bg-emerald-400',
  thinking: 'animate-pulse bg-violet-400',
  working: 'animate-pulse bg-amber-400',
  stopped: 'bg-red-500',
  error: 'bg-red-500',
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
  custom: 'API compatible',
}

export function TopBar() {
  const view = useSystemStore((state) => state.view)
  const setView = useSystemStore((state) => state.setView)
  const orionStatus = useSystemStore((state) => state.orionStatus)
  const isMaximized = useSystemStore((state) => state.isMaximized)
  const ai = useSettingsStore((state) => state.settings.ai)
  const observation = useSettingsStore((state) => state.settings.observation)
  const hasApiKey = useSettingsStore((state) => state.hasApiKey)
  const addSystemMessage = useChatStore((state) => state.addSystemMessage)

  const [observing, setObserving] = useState(false)
  const unsubAnalysisRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      unsubAnalysisRef.current?.()
    }
  }, [])

  const handleToggleObservation = useCallback(async () => {
    if (!hasApiKey || !ai.provider || !ai.model) {
      useUiStore.getState().addToast('warning', 'Configura la IA primero', 'Necesitas proveedor, modelo y API key')
      return
    }

    if (observing) {
      await window.orion?.observation.stop()
      setObserving(false)
      unsubAnalysisRef.current?.()
      unsubAnalysisRef.current = null
      useUiStore.getState().addToast('info', 'Observación detenida')
      return
    }

    const apiKey = await window.orion?.secrets.get('ai.apiKey')
    if (!apiKey) {
      useUiStore.getState().addToast('error', 'No hay API key configurada')
      return
    }

    const started = await window.orion?.observation.start({
      intervalMs: observation.intervalMs,
      model: ai.model,
      provider: ai.provider,
      apiKey,
      customBaseUrl: ai.customBaseUrl,
    })

    if (started) {
      setObserving(true)
      unsubAnalysisRef.current = window.orion?.observation.onAnalysis((event) => {
        addSystemMessage(event.text)
      }) ?? null
      useUiStore.getState().addToast('success', 'Observación activada', `Cada ${observation.intervalMs / 1000}s`)
    }
  }, [observing, hasApiKey, ai, observation.intervalMs, addSystemMessage])

  const navigateTo = (target: ViewKey): void => {
    setView(target)
  }

  const conversations = useConversationStore((state) => state.conversations)
  const activeConversationId = useConversationStore((state) => state.activeConversationId)
  const activeConversation = conversations.find((item) => item.id === activeConversationId)
  const conversationTitle = activeConversation?.title ?? 'Nueva conversación'

  const providerLabel = ai.provider ? PROVIDER_LABELS[ai.provider] ?? 'Proveedor' : null
  const modelLabel = providerLabel
    ? `${providerLabel}${ai.model ? ` · ${ai.model}` : ''}`
    : 'Sin proveedor configurado'

  const handleMinimize = (): void => {
    window.orion?.window.minimize()
  }

  const handleToggleMaximize = (): void => {
    void window.orion?.window.toggleMaximize().then((maximized) => {
      useSystemStore.getState().setIsMaximized(maximized)
    })
  }

  const handleClose = (): void => {
    window.orion?.window.close()
  }

  return (
    <header className="app-region-drag flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/70 bg-[#0B0B0D] px-3">
      {/* Estado de Orion y modelo */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-300">
          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[orionStatus])} />
          {STATUS_LABELS[orionStatus]}
        </span>

        <span className="hidden items-center gap-1.5 text-xs text-zinc-500 sm:flex">
          <span className="h-3 w-px bg-zinc-800" />
          <span className="max-w-[180px] truncate" title={conversationTitle}>
            {conversationTitle}
          </span>
        </span>

        <button
          type="button"
          onClick={() => navigateTo('settings')}
          className={cn(
            'app-region-no-drag flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
            hasApiKey
              ? 'border-violet-700/50 bg-violet-950/30 text-violet-300 hover:border-violet-500/60'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
          )}
          title="Cambiar proveedor de IA"
        >
          {modelLabel}
          <ChevronDown size={13} />
        </button>
      </div>

      {/* Acciones y controles de ventana */}
      <div className="app-region-no-drag flex items-center gap-1">
        <button
          type="button"
          onClick={handleToggleObservation}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors',
            observing
              ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300 animate-pulse'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
          )}
          title={observing ? 'Detener observación' : 'Activar observación de pantalla'}
        >
          {observing ? <EyeOff size={13} /> : <Eye size={13} />}
          {observing ? 'Detener' : 'Observar'}
        </button>

        <Button
          variant={view === 'settings' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => navigateTo('settings')}
          title="Configuración"
        >
          <Settings size={16} />
        </Button>

        <div className="mx-1 h-4 w-px bg-zinc-800" />

        <button
          type="button"
          onClick={handleMinimize}
          className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          title="Minimizar"
        >
          <Minimize size={15} />
        </button>

        <button
          type="button"
          onClick={handleToggleMaximize}
          className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? <Copy size={13} /> : <Square size={13} />}
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="flex h-8 w-10 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-600 hover:text-white"
          title="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  )
}