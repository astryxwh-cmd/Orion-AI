import { BrowserWindow, ipcMain } from 'electron'
import type { WebContents } from 'electron'
import {
  startObservation,
  stopObservation,
  getObservationStatus,
} from '../services/observationService'
import type { ObservationConfig } from '../services/observationService'

type Sender = { sender: WebContents }

function getWindow(event: Sender): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

export function registerObservationIpc(): void {
  ipcMain.handle(
    'observation:start',
    (event, config: ObservationConfig) => {
      const window = getWindow(event)
      if (!window) {
        throw new Error('No hay ventana activa.')
      }
      return startObservation(window, config)
    },
  )

  ipcMain.handle('observation:stop', () => {
    return stopObservation()
  })

  ipcMain.handle('observation:status', () => {
    return getObservationStatus()
  })
}
