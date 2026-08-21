import type { OrionApi } from './orion-api'

declare global {
  interface Window {
    orion: OrionApi
  }
}

export {}