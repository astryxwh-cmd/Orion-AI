import { app, ipcMain } from 'electron'
import { getSystemInfo } from '../services/systemService'

export function registerSystemIpc(): void {
  ipcMain.handle('system:get-info', () => getSystemInfo())

  ipcMain.handle('app:get-version', () => app.getVersion())
}