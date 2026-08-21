import { BrowserWindow, ipcMain } from 'electron'
import type { WebContents } from 'electron'

type Sender = { sender: WebContents }

function getWindow(event: Sender): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

export function registerWindowIpc(): void {
  ipcMain.on('window:minimize', (event) => {
    getWindow(event)?.minimize()
  })

  ipcMain.on('window:close', (event) => {
    getWindow(event)?.close()
  })

  ipcMain.handle('window:toggle-maximize', (event) => {
    const window = getWindow(event)
    if (!window) {
      return false
    }
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
    return window.isMaximized()
  })

  ipcMain.handle('window:is-maximized', (event) => {
    const window = getWindow(event)
    return window !== null && window.isMaximized()
  })
}