import { useRef, useState, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import { Paperclip, Send, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'

interface ChatInputProps {
  isGenerating: boolean
  onSend: (content: string, images?: string[]) => void
  onStop: () => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ChatInput({ isGenerating, onSend, onStop }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [images, setImages] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addToast = useUiStore((state) => state.addToast)

  const resize = (): void => {
    const element = textareaRef.current
    if (!element) {
      return
    }
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`
  }

  const submit = (): void => {
    const content = value.trim()
    if ((content.length === 0 && images.length === 0) || isGenerating) {
      return
    }
    onSend(content || 'Describe esta imagen', images.length > 0 ? images : undefined)
    setValue('')
    setImages([])
    window.requestAnimationFrame(resize)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const addImages = useCallback(async (files: FileList | File[]) => {
    const newImages: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        addToast('warning', 'Formato no soportado', `${file.name} no es una imagen`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast('warning', 'Imagen muy grande', `${file.name} supera 10 MB`)
        continue
      }
      try {
        const base64 = await fileToBase64(file)
        newImages.push(base64)
      } catch {
        addToast('error', 'Error al leer', `No se pudo leer ${file.name}`)
      }
    }
    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages])
    }
  }, [addToast])

  const handleAttach = (): void => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files
    if (files && files.length > 0) {
      void addImages(files)
    }
    event.target.value = ''
  }

  const handlePaste = useCallback((event: React.ClipboardEvent): void => {
    const items = event.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) imageFiles.push(file)
      }
    }
    if (imageFiles.length > 0) {
      event.preventDefault()
      void addImages(imageFiles)
    }
  }, [addImages])

  const removeImage = (index: number): void => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-zinc-800/70 bg-[#0B0B0D]/80 px-4 py-3">
      <div className="mx-auto max-w-3xl">
        {images.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((base64, index) => (
              <div key={index} className="relative shrink-0">
                <img
                  src={`data:image/jpeg;base64,${base64}`}
                  alt={`Adjunto ${index + 1}`}
                  className="h-16 w-16 rounded-lg object-cover border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-2 transition-colors focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/15">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={handleAttach}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Adjuntar imagen"
          >
            <Paperclip size={17} />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              resize()
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={images.length > 0 ? 'Escribe un mensaje sobre la imagen…' : 'Escribe un mensaje a Orion… (Enter para enviar)'}
            rows={1}
            className="max-h-[200px] flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed text-zinc-100 placeholder-zinc-500 outline-none"
          />

          {isGenerating ? (
            <Button variant="danger" size="icon" onClick={onStop} title="Detener generación">
              <Square size={15} fill="currentColor" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="icon"
              onClick={submit}
              disabled={value.trim().length === 0 && images.length === 0}
              title="Enviar mensaje"
            >
              <Send size={16} />
            </Button>
          )}
        </div>
        <p className="mt-1.5 px-2 text-[11px] text-zinc-600">
          Pega imágenes con Ctrl+V o usa el clip. Orion puede equivocarse.
        </p>
      </div>
    </div>
  )
}
