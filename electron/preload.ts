import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { OrionApi, SystemInfo, ToolCallResult } from '../src/types/orion-api'
import type { AIChatPayload, StreamChunkEvent, StreamEndEvent, StreamErrorEvent, StreamToolEvent } from '../src/types/ai'
import type { Conversation } from '../src/types/chat'

const api: OrionApi = {
  platform: process.platform,
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>,
  },
  window: {
    minimize: () => {
      ipcRenderer.send('window:minimize')
    },
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize') as Promise<boolean>,
    isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,
    close: () => {
      ipcRenderer.send('window:close')
    },
    onMaximizedChange: (callback) => {
      const listener = (_event: IpcRendererEvent, maximized: boolean): void => {
        callback(maximized)
      }
      ipcRenderer.on('window:maximized-changed', listener)
      return () => {
        ipcRenderer.removeListener('window:maximized-changed', listener)
      }
    },
  },
  system: {
    getInfo: () => ipcRenderer.invoke('system:get-info') as Promise<SystemInfo>,
  },
  secrets: {
    set: async (key, value) => {
      await ipcRenderer.invoke('secrets:set', key, value)
    },
    get: (key) => ipcRenderer.invoke('secrets:get', key) as Promise<string | null>,
    delete: async (key) => {
      await ipcRenderer.invoke('secrets:delete', key)
    },
  },
  ai: {
    start: (payload: AIChatPayload) => ipcRenderer.invoke('ai:start', payload) as Promise<string>,
    cancel: (streamId: string) => ipcRenderer.invoke('ai:cancel', streamId) as Promise<boolean>,
    cancelAll: () => ipcRenderer.invoke('ai:cancel-all') as Promise<boolean>,
    onStreamChunk: (callback: (event: StreamChunkEvent) => void) => {
      const listener = (_event: IpcRendererEvent, value: StreamChunkEvent): void => {
        callback(value)
      }
      ipcRenderer.on('ai:stream', listener)
      return () => {
        ipcRenderer.removeListener('ai:stream', listener)
      }
    },
    onStreamEnd: (callback: (event: StreamEndEvent) => void) => {
      const listener = (_event: IpcRendererEvent, value: StreamEndEvent): void => {
        callback(value)
      }
      ipcRenderer.on('ai:end', listener)
      return () => {
        ipcRenderer.removeListener('ai:end', listener)
      }
    },
    onStreamError: (callback: (event: StreamErrorEvent) => void) => {
      const listener = (_event: IpcRendererEvent, value: StreamErrorEvent): void => {
        callback(value)
      }
      ipcRenderer.on('ai:error', listener)
      return () => {
        ipcRenderer.removeListener('ai:error', listener)
      }
    },
    onToolEvent: (callback: (event: StreamToolEvent) => void) => {
      const listener = (_event: IpcRendererEvent, value: StreamToolEvent): void => {
        callback(value)
      }
      ipcRenderer.on('ai:tool', listener)
      return () => {
        ipcRenderer.removeListener('ai:tool', listener)
      }
    },
  },
  conversations: {
    list: () => ipcRenderer.invoke('conversations:list') as Promise<Conversation[]>,
    get: (id: string) => ipcRenderer.invoke('conversations:get', id) as Promise<Conversation | null>,
    create: (title: string) => ipcRenderer.invoke('conversations:create', title) as Promise<Conversation>,
    save: (conversation: Conversation) =>
      ipcRenderer.invoke('conversations:save', conversation) as Promise<boolean>,
    rename: (id: string, title: string) =>
      ipcRenderer.invoke('conversations:rename', id, title) as Promise<Conversation | null>,
    delete: (id: string) => ipcRenderer.invoke('conversations:delete', id) as Promise<boolean>,
    search: (query: string) => ipcRenderer.invoke('conversations:search', query) as Promise<Conversation[]>,
  },
  automation: {
    executeTool: (toolCall: { name: string; args: Record<string, unknown> }) =>
      ipcRenderer.invoke('automation:execute-tool', toolCall) as Promise<ToolCallResult>,
    setConfig: (config: { mouseSpeed?: number; typingSpeed?: number; actionDelayMs?: number }) =>
      ipcRenderer.invoke('automation:set-config', config) as Promise<boolean>,
  },
  observation: {
    start: (config: { intervalMs: number; model: string; provider: string; apiKey: string; customBaseUrl?: string }) =>
      ipcRenderer.invoke('observation:start', config) as Promise<boolean>,
    stop: () => ipcRenderer.invoke('observation:stop') as Promise<boolean>,
    status: () => ipcRenderer.invoke('observation:status') as Promise<{ active: boolean; intervalMs: number }>,
    onAnalysis: (callback: (event: { text: string; timestamp: number }) => void) => {
      const listener = (_event: IpcRendererEvent, value: { text: string; timestamp: number }): void => {
        callback(value)
      }
      ipcRenderer.on('observation:analysis', listener)
      return () => {
        ipcRenderer.removeListener('observation:analysis', listener)
      }
    },
  },
  mobile: {
    start: () => ipcRenderer.invoke('mobile:start') as Promise<{ success: boolean; ip?: string; port?: number; url?: string; error?: string }>,
    stop: () => ipcRenderer.invoke('mobile:stop') as Promise<{ success: boolean }>,
    status: () => ipcRenderer.invoke('mobile:status') as Promise<{
      running: boolean; ip: string; port: number; clients: number;
      clientsList: Array<{ id: string; name: string; lastSeen: number }>;
    }>,
    onClientCount: (callback: (count: number) => void) => {
      const listener = (_event: IpcRendererEvent, count: number): void => {
        callback(count)
      }
      ipcRenderer.on('mobile:client-count', listener)
      return () => {
        ipcRenderer.removeListener('mobile:client-count', listener)
      }
    },
  },
  adb: {
    check: () => ipcRenderer.invoke('adb:check') as Promise<{ installed: boolean }>,
    setPath: (path: string) => ipcRenderer.invoke('adb:set-path', path) as Promise<{ success: boolean }>,
    devices: () => ipcRenderer.invoke('adb:devices') as Promise<{ success: boolean; devices?: Array<{ id: string; status: string; model?: string }>; error?: string }>,
    connect: (ip: string, port?: number) => ipcRenderer.invoke('adb:connect', ip, port) as Promise<{ success: boolean; result?: string; error?: string }>,
    disconnect: (deviceId: string) => ipcRenderer.invoke('adb:disconnect', deviceId) as Promise<{ success: boolean; result?: string; error?: string }>,
    screenshot: (deviceId?: string) => ipcRenderer.invoke('adb:screenshot', deviceId) as Promise<{ success: boolean; image?: string; error?: string }>,
    tap: (x: number, y: number, deviceId?: string) => ipcRenderer.invoke('adb:tap', x, y, deviceId) as Promise<{ success: boolean; result?: string; error?: string }>,
    swipe: (x1: number, y1: number, x2: number, y2: number, deviceId?: string) => ipcRenderer.invoke('adb:swipe', x1, y1, x2, y2, deviceId) as Promise<{ success: boolean; result?: string; error?: string }>,
    type: (text: string, deviceId?: string) => ipcRenderer.invoke('adb:type', text, deviceId) as Promise<{ success: boolean; result?: string; error?: string }>,
    key: (key: string, deviceId?: string) => ipcRenderer.invoke('adb:key', key, deviceId) as Promise<{ success: boolean; result?: string; error?: string }>,
    openApp: (packageName: string, deviceId?: string) => ipcRenderer.invoke('adb:open-app', packageName, deviceId) as Promise<{ success: boolean; result?: string; error?: string }>,
    listApps: (deviceId?: string) => ipcRenderer.invoke('adb:list-apps', deviceId) as Promise<{ success: boolean; apps?: string[]; error?: string }>,
    currentApp: (deviceId?: string) => ipcRenderer.invoke('adb:current-app', deviceId) as Promise<{ success: boolean; activity?: string; error?: string }>,
  },
}

contextBridge.exposeInMainWorld('orion', api)