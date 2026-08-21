import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Conversation } from '../../src/types/chat'

let cache: Conversation[] | null = null

function dataFilePath(): string {
  return path.join(app.getPath('userData'), 'orion-conversations.json')
}

function loadConversations(): Conversation[] {
  if (cache !== null) {
    return cache
  }
  try {
    const file = dataFilePath()
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<Conversation>[]
      cache = Array.isArray(parsed) ? (parsed as Conversation[]) : []
    } else {
      cache = []
    }
  } catch (error) {
    console.error('[orion] No se pudo leer el almacén de conversaciones:', error)
    cache = []
  }
  return cache
}

export function listConversations(): Conversation[] {
  return loadConversations()
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getConversation(id: string): Conversation | null {
  return loadConversations().find((conversation) => conversation.id === id) ?? null
}

export function createConversation(title: string): Conversation {
  const timestamp = Date.now()
  const conversation: Conversation = {
    id: randomUUID(),
    title: title.trim().length > 0 ? title.trim() : 'Nueva conversación',
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
  }
  cache = [conversation, ...loadConversations()]
  persistConversations()
  return conversation
}

export function saveConversation(conversation: Conversation): void {
  const all = loadConversations()
  const index = all.findIndex((item) => item.id === conversation.id)
  if (index >= 0) {
    all[index] = { ...conversation, updatedAt: Date.now() }
  } else {
    all.unshift({ ...conversation, updatedAt: Date.now() })
  }
  cache = all
  persistConversations()
}

export function renameConversation(id: string, title: string): Conversation | null {
  const all = loadConversations()
  const conversation = all.find((item) => item.id === id)
  if (!conversation) {
    return null
  }
  conversation.title = title.trim().length > 0 ? title.trim() : conversation.title
  conversation.updatedAt = Date.now()
  cache = all
  persistConversations()
  return conversation
}

export function deleteConversation(id: string): boolean {
  const all = loadConversations()
  const filtered = all.filter((item) => item.id !== id)
  if (filtered.length === all.length) {
    return false
  }
  cache = filtered
  persistConversations()
  return true
}

export function searchConversations(query: string): Conversation[] {
  const normalized = query.trim().toLowerCase()
  if (normalized.length === 0) {
    return listConversations()
  }
  return listConversations().filter((conversation) => {
    if (conversation.title.toLowerCase().includes(normalized)) {
      return true
    }
    return conversation.messages.some((message) =>
      message.content.toLowerCase().includes(normalized),
    )
  })
}

function persistConversations(): void {
  try {
    const file = dataFilePath()
    const temp = `${file}.tmp`
    fs.writeFileSync(temp, JSON.stringify(loadConversations(), null, 2), 'utf-8')
    fs.renameSync(temp, file)
  } catch (error) {
    console.error('[orion] No se pudo guardar el almacén de conversaciones:', error)
    throw error
  }
}