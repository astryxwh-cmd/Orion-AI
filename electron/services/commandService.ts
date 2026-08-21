import { exec } from 'node:child_process'
import fs from 'node:fs'
import { promisify } from 'node:util'
import { app, shell } from 'electron'

const execAsync = promisify(exec)

export interface RunCommandParams {
  command: string
  cwd?: string
  timeout?: number
}

export interface OpenAppParams {
  target: string
  args?: string[]
}

export async function runCommand(params: RunCommandParams): Promise<string> {
  const timeout = params.timeout ?? 30000
  const cwd = params.cwd ?? app.getPath('home')

  try {
    const { stdout, stderr } = await execAsync(params.command, {
      cwd,
      timeout,
      maxBuffer: 1024 * 1024,
      encoding: 'utf-8',
    })

    const parts: string[] = []
    if (stdout.trim()) {
      parts.push(`Salida:\n${stdout.trim()}`)
    }
    if (stderr.trim()) {
      parts.push(`Errores/Advertencias:\n${stderr.trim()}`)
    }
    if (parts.length === 0) {
      return 'Comando ejecutado sin salida.'
    }
    return parts.join('\n\n')
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const execError = error as { code: number; stdout?: string; stderr?: string; message?: string }
      const parts: string[] = [`Código de salida: ${execError.code}`]
      if (execError.stdout?.trim()) {
        parts.push(`Salida:\n${execError.stdout.trim()}`)
      }
      if (execError.stderr?.trim()) {
        parts.push(`Error:\n${execError.stderr.trim()}`)
      }
      return parts.join('\n\n')
    }
    throw error
  }
}

export async function openApplication(params: OpenAppParams): Promise<string> {
  const target = params.target.trim()

  const opened = await shell.openPath(target)
  if (opened) {
    return `Aplicación abierta: ${target} (nota: ${opened})`
  }
  return `Aplicación abierta: ${target}`
}

export async function openUrl(params: { url: string }): Promise<string> {
  await shell.openExternal(params.url)
  return `Navegador abierto con: ${params.url}`
}

export async function openFolder(params: { path: string }): Promise<string> {
  const folderPath = params.path.replace(/\\/g, '/')

  if (!fs.existsSync(folderPath)) {
    throw new Error(`Directorio no encontrado: ${folderPath}`)
  }

  shell.showItemInFolder(folderPath)
  return `Explorador abierto en: ${folderPath}`
}

export async function getEnvironmentInfo(): Promise<string> {
  return JSON.stringify({
    platform: process.platform,
    arch: process.arch,
    home: app.getPath('home'),
    desktop: app.getPath('desktop'),
    documents: app.getPath('documents'),
    downloads: app.getPath('downloads'),
    appData: app.getPath('appData'),
    temp: app.getPath('temp'),
  })
}
