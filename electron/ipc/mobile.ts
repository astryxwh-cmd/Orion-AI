import { ipcMain, BrowserWindow } from 'electron'
import {
  startMobileServer,
  stopMobileServer,
  getClientCount,
  getClientsList,
  getLocalIPForDisplay,
  getPort,
} from '../server/wsServer'
import {
  checkAdbInstalled,
  listDevices,
  setAdbPath,
  takeScreenshot as adbScreenshot,
  tap as adbTap,
  swipe as adbSwipe,
  typeText as adbType,
  pressKey as adbKey,
  openApp as adbOpenApp,
  listInstalledApps as adbListApps,
  getCurrentActivity as adbCurrentApp,
  connectAdbTcp,
  disconnectAdb,
} from '../adb/adbService'

let mobileServerRunning = false

export function registerMobileIpc(): void {
  ipcMain.handle('mobile:start', async (event) => {
    if (mobileServerRunning) {
      const ip = getLocalIPForDisplay()
      const port = getPort()
      return { success: true, ip, port, url: `http://${ip}:${port}` }
    }

    try {
      const window = BrowserWindow.fromWebContents(event.sender)
      if (!window) return { success: false, error: 'No se encontró la ventana' }

      const { ip, port } = await startMobileServer(window.webContents)
      mobileServerRunning = true

      return { success: true, ip, port, url: `http://${ip}:${port}` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('mobile:stop', () => {
    stopMobileServer()
    mobileServerRunning = false
    return { success: true }
  })

  ipcMain.handle('mobile:status', () => {
    return {
      running: mobileServerRunning,
      ip: getLocalIPForDisplay(),
      port: getPort(),
      clients: getClientCount(),
      clientsList: getClientsList(),
    }
  })

  ipcMain.handle('mobile:client-count', () => {
    return getClientCount()
  })

  ipcMain.handle('adb:check', async () => {
    const installed = await checkAdbInstalled()
    return { installed }
  })

  ipcMain.handle('adb:set-path', (_event, adbPath: string) => {
    setAdbPath(adbPath)
    return { success: true }
  })

  ipcMain.handle('adb:devices', async () => {
    try {
      const devices = await listDevices()
      return { success: true, devices }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:connect', async (_event, ip: string, port?: number) => {
    try {
      const result = await connectAdbTcp(ip, port)
      return { success: true, result }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:disconnect', async (_event, deviceId: string) => {
    try {
      const result = await disconnectAdb(deviceId)
      return { success: true, result }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:screenshot', async (_event, deviceId?: string) => {
    try {
      const base64 = await adbScreenshot(deviceId)
      return { success: true, image: base64 }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:tap', async (_event, x: number, y: number, deviceId?: string) => {
    try {
      const result = await adbTap(x, y, deviceId)
      return { success: true, result }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:swipe', async (_event, x1: number, y1: number, x2: number, y2: number, deviceId?: string) => {
    try {
      const result = await adbSwipe(x1, y1, x2, y2, 300, deviceId)
      return { success: true, result }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:type', async (_event, text: string, deviceId?: string) => {
    try {
      const result = await adbType(text, deviceId)
      return { success: true, result }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:key', async (_event, key: string, deviceId?: string) => {
    try {
      const result = await adbKey(key, deviceId)
      return { success: true, result }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:open-app', async (_event, packageName: string, deviceId?: string) => {
    try {
      const result = await adbOpenApp(packageName, deviceId)
      return { success: true, result }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:list-apps', async (_event, deviceId?: string) => {
    try {
      const apps = await adbListApps(deviceId)
      return { success: true, apps }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('adb:current-app', async (_event, deviceId?: string) => {
    try {
      const activity = await adbCurrentApp(deviceId)
      return { success: true, activity }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })
}
