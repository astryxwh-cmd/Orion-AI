import { ipcMain } from 'electron'
import type { Conversation } from '../../src/types/chat'
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  renameConversation,
  saveConversation,
  searchConversations,
} from '../services/conversationService'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function registerConversationsIpc(): void {
  ipcMain.handle('conversations:list', () => listConversations())

  ipcMain.handle('conversations:get', (_event, id: string) => {
    if (!isString(id)) {
      return null
    }
    return getConversation(id)
  })

  ipcMain.handle('conversations:create', (_event, title: string) => {
    return createConversation(isString(title) ? title : '')
  })

  ipcMain.handle('conversations:save', (_event, conversation: Conversation) => {
    if (!conversation || typeof conversation.id !== 'string') {
      throw new Error('Conversación inválida para guardar.')
    }
    saveConversation(conversation)
    return true
  })

  ipcMain.handle('conversations:rename', (_event, id: string, title: string) => {
    if (!isString(id) || !isString(title)) {
      return null
    }
    return renameConversation(id, title)
  })

  ipcMain.handle('conversations:delete', (_event, id: string) => {
    if (!isString(id)) {
      return false
    }
    return deleteConversation(id)
  })

  ipcMain.handle('conversations:search', (_event, query: string) => {
    return searchConversations(isString(query) ? query : '')
  })
}