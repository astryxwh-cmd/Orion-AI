import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

const execAsync = promisify(exec)

let adbPath = 'adb'

function getAdbPath(): string {
  return adbPath
}

export function setAdbPath(path: string): void {
  adbPath = path
}

async function runAdb(args: string[], timeoutMs = 10000): Promise<string> {
  try {
    const { stdout } = await execAsync(`${getAdbPath()} ${args.join(' ')}`, {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    })
    return stdout.trim()
  } catch (err: any) {
    if (err.killed) {
      throw new Error('ADB timeout - el dispositivo no responde')
    }
    throw new Error(`ADB error: ${err.stderr || err.message}`)
  }
}

export async function checkAdbInstalled(): Promise<boolean> {
  try {
    await runAdb(['version'])
    return true
  } catch {
    return false
  }
}

export interface AdbDevice {
  id: string
  status: string
  model?: string
}

export async function listDevices(): Promise<AdbDevice[]> {
  const output = await runAdb(['devices', '-l'])
  const lines = output.split('\n').slice(1).filter((l) => l.trim().length > 0)

  const devices: AdbDevice[] = []
  for (const line of lines) {
    const parts = line.split(/\s+/)
    if (parts.length >= 2) {
      const id = parts[0]
      const status = parts[1]
      const modelMatch = line.match(/model:(\S+)/)
      devices.push({
        id,
        status,
        model: modelMatch?.[1],
      })
    }
  }
  return devices
}

export async function takeScreenshot(deviceId?: string): Promise<string> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  const tmpPath = '/sdcard/orion-screenshot.png'
  const localTmp = path.join(app.getPath('temp'), `orion-phone-${Date.now()}.png`)

  await runAdb([...deviceArg, 'shell', 'screencap', '-p', tmpPath], 15000)
  await runAdb([...deviceArg, 'pull', tmpPath, localTmp], 15000)
  await runAdb([...deviceArg, 'shell', 'rm', tmpPath])

  const buffer = fs.readFileSync(localTmp)
  const base64 = buffer.toString('base64')

  try { fs.unlinkSync(localTmp) } catch {}

  return base64
}

export async function tap(x: number, y: number, deviceId?: string): Promise<string> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  await runAdb([...deviceArg, 'shell', 'input', 'tap', String(x), String(y)])
  return `Tap en (${x}, ${y})`
}

export async function swipe(
  x1: number, y1: number, x2: number, y2: number, durationMs = 300, deviceId?: string,
): Promise<string> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  await runAdb([...deviceArg, 'shell', 'input', 'swipe',
    String(x1), String(y1), String(x2), String(y2), String(durationMs)])
  return `Swipe de (${x1},${y1}) a (${x2},${y2})`
}

export async function typeText(text: string, deviceId?: string): Promise<string> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  const escaped = text.replace(/ /g, '%s').replace(/'/g, "\\'")
  await runAdb([...deviceArg, 'shell', 'input', 'text', escaped])
  return `Texto escrito: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`
}

export async function pressKey(key: string, deviceId?: string): Promise<string> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  const KEY_MAP: Record<string, string> = {
    enter: '66', back: '4', home: '3', recent: '187',
    volumeup: '24', volumedown: '25', power: '26',
    tab: '61', delete: '67', space: '62',
    up: '19', down: '20', left: '21', right: '22',
    camera: '27',
  }
  const keyCode = KEY_MAP[key.toLowerCase()] ?? key
  await runAdb([...deviceArg, 'shell', 'input', 'keyevent', keyCode])
  return `Tecla presionada: ${key}`
}

export async function openApp(packageName: string, deviceId?: string): Promise<string> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  await runAdb([...deviceArg, 'shell', 'monkey', '-p', packageName, '-c',
    'android.intent.category.LAUNCHER', '1'])
  return `App abierta: ${packageName}`
}

export async function installApp(apkPath: string, deviceId?: string): Promise<string> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  await runAdb([...deviceArg, 'install', '-r', apkPath], 60000)
  return `App instalada: ${apkPath}`
}

export async function listInstalledApps(deviceId?: string): Promise<string[]> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  const output = await runAdb([...deviceArg, 'shell', 'pm', 'list', 'packages', '-3'])
  return output.split('\n').filter((l) => l.startsWith('package:')).map((l) => l.replace('package:', ''))
}

export async function getCurrentActivity(deviceId?: string): Promise<string> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  const output = await runAdb([...deviceArg, 'shell', 'dumpsys', 'activity', 'activities',
    '|', 'grep', 'mResumedActivity'])
  return output.trim() || 'No detectada'
}

export async function getScreenSize(deviceId?: string): Promise<{ width: number; height: number }> {
  const deviceArg = deviceId ? ['-s', deviceId] : []
  const output = await runAdb([...deviceArg, 'shell', 'wm', 'size'])
  const match = output.match(/(\d+)x(\d+)/)
  if (match) {
    return { width: parseInt(match[1]), height: parseInt(match[2]) }
  }
  return { width: 1080, height: 2400 }
}

export async function connectAdbTcp(ip: string, port = 5555): Promise<string> {
  const result = await runAdb(['connect', `${ip}:${port}`], 15000)
  return result
}

export async function disconnectAdb(deviceId: string): Promise<string> {
  return await runAdb(['disconnect', deviceId])
}
