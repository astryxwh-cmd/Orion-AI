import { ipcMain } from 'electron'
import { deleteSecret, getSecret, setSecret } from '../services/secretsService'

/**
 * Gestión de secretos (API keys) usando cifrado nativo del sistema.
 * Nunca se devuelven ni registran en logs.
 */
export function registerSecretsIpc(): void {
  ipcMain.handle('secrets:set', (_event, key: string, value: string) => {
    if (!key || typeof key !== 'string' || typeof value !== 'string') {
      throw new Error('Parámetros inválidos para guardar el secreto.')
    }
    if (value.length > 0) {
      setSecret(key, value)
    } else {
      deleteSecret(key)
    }
  })

  ipcMain.handle('secrets:get', (_event, key: string) => {
    if (typeof key !== 'string') {
      return null
    }
    return getSecret(key)
  })

  ipcMain.handle('secrets:delete', (_event, key: string) => {
    if (typeof key === 'string') {
      deleteSecret(key)
    }
  })
}