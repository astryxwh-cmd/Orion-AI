import type {
  AIChatPayload,
  StreamChunkEvent,
  StreamEndEvent,
  StreamErrorEvent,
  StreamToolEvent,
} from './ai'
import type { Conversation } from './chat'

export interface SystemInfo {
  platform: string
  arch: string
  hostname: string
  cpuModel: string
  cpuCores: number
  totalMemoryBytes: number
  freeMemoryBytes: number
  uptimeSeconds: number
  nodeVersion: string
  electronVersion: string
  chromeVersion: string
}

export interface ToolCallResult {
  toolName: string
  result: string
  image?: string
  error?: boolean
}

export interface OrionApi {
  platform: string
  app: {
    getVersion: () => Promise<string>
  }
  window: {
    minimize: () => void
    toggleMaximize: () => Promise<boolean>
    isMaximized: () => Promise<boolean>
    close: () => void
    onMaximizedChange: (callback: (maximized: boolean) => void) => () => void
  }
  system: {
    getInfo: () => Promise<SystemInfo>
  }
  secrets: {
    set: (key: string, value: string) => Promise<void>
    get: (key: string) => Promise<string | null>
    delete: (key: string) => Promise<void>
  }
  ai: {
    start: (payload: AIChatPayload) => Promise<string>
    cancel: (streamId: string) => Promise<boolean>
    cancelAll: () => Promise<boolean>
    onStreamChunk: (callback: (event: StreamChunkEvent) => void) => () => void
    onStreamEnd: (callback: (event: StreamEndEvent) => void) => () => void
    onStreamError: (callback: (event: StreamErrorEvent) => void) => () => void
    onToolEvent: (callback: (event: StreamToolEvent) => void) => () => void
  }
  conversations: {
    list: () => Promise<Conversation[]>
    get: (id: string) => Promise<Conversation | null>
    create: (title: string) => Promise<Conversation>
    save: (conversation: Conversation) => Promise<boolean>
    rename: (id: string, title: string) => Promise<Conversation | null>
    delete: (id: string) => Promise<boolean>
    search: (query: string) => Promise<Conversation[]>
  }
  automation: {
    executeTool: (toolCall: { name: string; args: Record<string, unknown> }) => Promise<ToolCallResult>
    setConfig: (config: { mouseSpeed?: number; typingSpeed?: number; actionDelayMs?: number }) => Promise<boolean>
  }
  observation: {
    start: (config: { intervalMs: number; model: string; provider: string; apiKey: string; customBaseUrl?: string }) => Promise<boolean>
    stop: () => Promise<boolean>
    status: () => Promise<{ active: boolean; intervalMs: number }>
    onAnalysis: (callback: (event: { text: string; timestamp: number }) => void) => () => void
  }
  mobile: {
    start: () => Promise<{ success: boolean; ip?: string; port?: number; url?: string; error?: string }>
    stop: () => Promise<{ success: boolean }>
    status: () => Promise<{
      running: boolean; ip: string; port: number; clients: number;
      clientsList: Array<{ id: string; name: string; lastSeen: number }>;
    }>
    onClientCount: (callback: (count: number) => void) => () => void
  }
  adb: {
    check: () => Promise<{ installed: boolean }>
    setPath: (path: string) => Promise<{ success: boolean }>
    devices: () => Promise<{ success: boolean; devices?: Array<{ id: string; status: string; model?: string }>; error?: string }>
    connect: (ip: string, port?: number) => Promise<{ success: boolean; result?: string; error?: string }>
    disconnect: (deviceId: string) => Promise<{ success: boolean; result?: string; error?: string }>
    screenshot: (deviceId?: string) => Promise<{ success: boolean; image?: string; error?: string }>
    tap: (x: number, y: number, deviceId?: string) => Promise<{ success: boolean; result?: string; error?: string }>
    swipe: (x1: number, y1: number, x2: number, y2: number, deviceId?: string) => Promise<{ success: boolean; result?: string; error?: string }>
    type: (text: string, deviceId?: string) => Promise<{ success: boolean; result?: string; error?: string }>
    key: (key: string, deviceId?: string) => Promise<{ success: boolean; result?: string; error?: string }>
    openApp: (packageName: string, deviceId?: string) => Promise<{ success: boolean; result?: string; error?: string }>
    listApps: (deviceId?: string) => Promise<{ success: boolean; apps?: string[]; error?: string }>
    currentApp: (deviceId?: string) => Promise<{ success: boolean; activity?: string; error?: string }>
  }
}