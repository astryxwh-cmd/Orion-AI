import { useEffect, useRef } from 'react'
import { ChatInput } from '@/components/chat/ChatInput'
import { EmptyChatState } from '@/components/chat/EmptyChatState'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator'
import { useChatStore } from '@/stores/chatStore'

export function ChatPage() {
  const messages = useChatStore((state) => state.messages)
  const isGenerating = useChatStore((state) => state.isGenerating)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const stopGeneration = useChatStore((state) => state.stopGeneration)

  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isGenerating])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center">
              <EmptyChatState />
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}
          {isGenerating && <ThinkingIndicator />}
          <div ref={endRef} className="h-px" />
        </div>
      </div>

      <ChatInput isGenerating={isGenerating} onSend={(content, images) => void sendMessage(content, images)} onStop={stopGeneration} />
    </div>
  )
}