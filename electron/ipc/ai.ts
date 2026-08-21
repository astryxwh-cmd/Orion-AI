import { BrowserWindow, ipcMain } from 'electron'
import type { WebContents } from 'electron'
import type { AIChatPayload } from '../../src/types/ai'
import { cancelAiStream, cancelAllAiStreams, startAiStream } from '../services/aiStreamService'

type Sender = { sender: WebContents }

function getWindow(event: Sender): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

export function registerAiIpc(): void {
  ipcMain.handle('ai:start', (event, payload: AIChatPayload) => {
    const window = getWindow(event)
    if (!window) {
      throw new Error('No hay ventana activa para iniciar el chat.')
    }
    return startAiStream(window, payload)
  })

  ipcMain.handle('ai:cancel', (_event, streamId: string) => {
    if (typeof streamId !== 'string' || streamId.length === 0) {
      return false
    }
    return cancelAiStream(streamId)
  })

  ipcMain.handle('ai:cancel-all', () => {
    cancelAllAiStreams()
    return true
  })
}