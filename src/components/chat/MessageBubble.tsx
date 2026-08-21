import { Bot } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'
import { cn } from '@/utils/cn'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  if (message.role === 'system') {
    return (
      <div className="flex justify-center animate-fade-in">
        <span className="max-w-lg rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-1.5 text-center text-xs text-zinc-400">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex animate-fade-up gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 shadow-md shadow-violet-950/40">
          <Bot size={16} className="text-white" strokeWidth={2.2} />
        </div>
      )}

      <div className={cn('flex max-w-[82%] flex-col', isUser ? 'items-end' : 'items-start')}>
        {isUser && message.images && message.images.length > 0 && (
          <div className="mb-1.5 flex gap-1.5 flex-wrap justify-end">
            {message.images.map((base64, index) => (
              <img
                key={index}
                src={`data:image/jpeg;base64,${base64}`}
                alt={`Imagen ${index + 1}`}
                className="max-h-40 rounded-xl border border-violet-500/30 object-cover"
              />
            ))}
          </div>
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
            isUser
              ? 'rounded-br-md bg-violet-600 text-white shadow-sm shadow-violet-950/30'
              : 'rounded-tl-md border border-zinc-800 bg-zinc-900/70 text-zinc-200',
          )}
        >
          {message.content}
        </div>
        <span className="mt-1 px-1 text-[10px] text-zinc-600">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  )
}