import fs from 'node:fs'
import path from 'node:path'

export interface ReadFileParams {
  path: string
  encoding?: BufferEncoding
}

export interface WriteFileParams {
  path: string
  content: string
  append?: boolean
}

export interface ListDirectoryParams {
  path: string
  recursive?: boolean
}

function normalizePath(filePath: string): string {
  return path.resolve(filePath.replace(/\\/g, '/'))
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export async function readFile(params: ReadFileParams): Promise<string> {
  const filePath = normalizePath(params.path)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`)
  }

  const stat = fs.statSync(filePath)
  if (stat.isDirectory()) {
    throw new Error(`La ruta es un directorio, no un archivo: ${filePath}`)
  }

  if (stat.size > 10 * 1024 * 1024) {
    throw new Error(`El archivo es demasiado grande (${formatSize(stat.size)}). Máximo 10 MB.`)
  }

  const content = fs.readFileSync(filePath, { encoding: params.encoding ?? 'utf-8' })
  return `📄 ${filePath} (${formatSize(stat.size)}):\n\n${content}`
}

export async function writeFile(params: WriteFileParams): Promise<string> {
  const filePath = normalizePath(params.path)
  const dir = path.dirname(filePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (params.append && fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, params.content, 'utf-8')
    return `Contenido añadido a ${filePath}`
  }

  fs.writeFileSync(filePath, params.content, 'utf-8')
  return `Archivo ${params.append ? 'creado' : 'escrito'} en ${filePath}`
}

export async function listDirectory(params: ListDirectoryParams): Promise<string> {
  const dirPath = normalizePath(params.path)

  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directorio no encontrado: ${dirPath}`)
  }

  const stat = fs.statSync(dirPath)
  if (!stat.isDirectory()) {
    throw new Error(`La ruta no es un directorio: ${dirPath}`)
  }

  const entries: string[] = []

  function readDir(dir: string, prefix: string): void {
    const items = fs.readdirSync(dir, { withFileTypes: true })
    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      const itemStat = fs.statSync(fullPath)

      if (item.isDirectory()) {
        entries.push(`${prefix}📁 ${item.name}/`)
        if (params.recursive) {
          readDir(fullPath, prefix + '  ')
        }
      } else {
        entries.push(`${prefix}📄 ${item.name} (${formatSize(itemStat.size)})`)
      }
    }
  }

  entries.push(`📂 ${dirPath}/`)
  readDir(dirPath, '  ')

  return entries.join('\n')
}

export async function fileExists(params: { path: string }): Promise<string> {
  const filePath = normalizePath(params.path)
  const exists = fs.existsSync(filePath)
  return JSON.stringify({ exists, path: filePath })
}

export async function getFileInfo(params: { path: string }): Promise<string> {
  const filePath = normalizePath(params.path)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`)
  }

  const stat = fs.statSync(filePath)
  return JSON.stringify({
    path: filePath,
    isFile: stat.isFile(),
    isDirectory: stat.isDirectory(),
    size: stat.size,
    sizeFormatted: formatSize(stat.size),
    created: stat.birthtime.toISOString(),
    modified: stat.mtime.toISOString(),
  })
}
