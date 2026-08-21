import { ipcMain } from 'electron'
import { executeTool, type ToolCall } from '../services/toolExecutor'
import {
  setMouseSpeed,
  setKeyDelay,
  setMouseDelay,
} from '../services/automationService'

export function registerAutomationIpc(): void {
  ipcMain.handle('automation:execute-tool', async (_event, toolCall: ToolCall) => {
    return executeTool(toolCall)
  })

  ipcMain.handle(
    'automation:set-config',
    async (_event, config: { mouseSpeed?: number; typingSpeed?: number; actionDelayMs?: number }) => {
      if (config.mouseSpeed !== undefined) {
        setMouseSpeed(config.mouseSpeed)
      }
      if (config.typingSpeed !== undefined) {
        const delay = Math.max(10, 200 - config.typingSpeed * 18)
        setKeyDelay(delay)
      }
      if (config.actionDelayMs !== undefined) {
        setMouseDelay(config.actionDelayMs)
      }
      return true
    },
  )
}
