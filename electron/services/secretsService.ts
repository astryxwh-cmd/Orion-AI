import { app, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

interface SecretFile {
  [key: string]: string
}

let cache: SecretFile | null = null

function secretsFilePath(): string {
  return path.join(app.getPath('userData'), 'orion-secrets.json')
}

function loadSecrets(): SecretFile {
  if (cache !== null) {
    return cache
  }
  try {
    const file = secretsFilePath()
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<SecretFile>
      cache = parsed && typeof parsed === 'object' ? (parsed as SecretFile) : {}
    } else {
      cache = {}
    }
  } catch (error) {
    console.error('[orion] No se pudo leer el almacén de secretos:', error)
    cache = {}
  }
  return cache
}

function persistSecrets(): void {
  try {
    const file = secretsFilePath()
    fs.writeFileSync(file, JSON.stringify(loadSecrets(), null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    })
  } catch (error) {
    console.error('[orion] No se pudo guardar el almacén de secretos:', error)
    throw error
  }
}

export function setSecret(key: string, value: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('El cifrado del sistema no está disponible para guardar claves con seguridad.')
  }
  const encrypted = safeStorage.encryptString(value).toString('base64')
  loadSecrets()[key] = encrypted
  persistSecrets()
}

export function getSecret(key: string): string | null {
  if (!safeStorage.isEncryptionAvailable()) {
    return null
  }
  const entry = loadSecrets()[key]
  if (!entry) {
    return null
  }
  try {
    return safeStorage.decryptString(Buffer.from(entry, 'base64'))
  } catch (error) {
    console.error('[orion] No se pudo descifrar el secreto solicitado:', error)
    return null
  }
}

export function deleteSecret(key: string): void {
  delete loadSecrets()[key]
  persistSecrets()
}