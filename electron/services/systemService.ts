import os from 'node:os'
import type { SystemInfo } from '../../src/types/orion-api'

export function getSystemInfo(): SystemInfo {
  const cpu = os.cpus()[0]
  return {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    cpuModel: cpu?.model ?? 'Desconocido',
    cpuCores: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    uptimeSeconds: os.uptime(),
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
  }
}