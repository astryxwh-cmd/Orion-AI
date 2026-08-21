import { WebSocketServer, WebSocket } from 'ws'
import http from 'node:http'
import os from 'node:os'
import type { WebContents } from 'electron'
import { startAiStream } from '../services/aiStreamService'
import type { AISettingsPayload } from '../../src/types/ai'

interface MobileClient {
  ws: WebSocket
  id: string
  name: string
  lastSeen: number
}

interface MobileCommand {
  type: 'chat' | 'screenshot-request' | 'ping'
  content?: string
  conversationId?: string
}

interface MobileResponse {
  type: 'chat' | 'screenshot' | 'pong' | 'error' | 'status'
  content?: string
  image?: string
  streamId?: string
  toolCalls?: Array<{ name: string; args: Record<string, unknown> }>
  error?: string
}

let wss: WebSocketServer | null = null
let httpServer: http.Server | null = null
const clients = new Map<string, MobileClient>()
let clientCounter = 0
let targetWindow: WebContents | null = null

function getLocalIP(): string {
  const interfaces = os.networkInterfaces()
  const VPN_KEYWORDS = ['radmin', 'vpn', 'tun', 'tap', 'wireguard', 'hamachi', 'zerotier']
  let fallback = '127.0.0.1'

  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase()
    if (VPN_KEYWORDS.some((kw) => lowerName.includes(kw))) continue

    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
          return iface.address
        }
        if (!fallback || fallback === '127.0.0.1') {
          fallback = iface.address
        }
      }
    }
  }
  return fallback
}

function sendToClient(client: MobileClient, data: MobileResponse): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(data))
  }
}

function broadcastToClients(data: MobileResponse): void {
  for (const client of clients.values()) {
    sendToClient(client, data)
  }
}

function handleMobileCommand(client: MobileClient, command: MobileCommand): void {
  switch (command.type) {
    case 'ping':
      sendToClient(client, { type: 'pong' })
      client.lastSeen = Date.now()
      break

    case 'chat':
      if (command.content) {
        void handleChatCommand(client, command.content)
      }
      break

    case 'screenshot-request':
      void handleScreenshotRequest(client)
      break
  }
}

async function handleChatCommand(client: MobileClient, content: string): Promise<void> {
  const streamId = `mobile-${Date.now()}-${client.id}`

  sendToClient(client, { type: 'status', content: 'Procesando...', streamId })

  try {
    const settings: AISettingsPayload = {
      provider: 'openrouter',
      model: 'google/gemma-4-31b-it:free',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: 'Eres Orion AI. Responde en español. El usuario te controla desde su celular.',
    }

    let responseText = ''

    const fakeWebContents = {
      isDestroyed: () => false,
      send: (channel: string, data: unknown) => {
        if (channel === 'ai:stream' && data && typeof data === 'object' && 'text' in data) {
          responseText += (data as { text: string }).text
        }
      },
    } as WebContents

    const messages = [
      { role: 'user' as const, content },
    ]

    await startAiStream(fakeWebContents as any, {
      messages,
      settings,
    })

    sendToClient(client, {
      type: 'chat',
      content: responseText || 'Procesado.',
      streamId,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    sendToClient(client, { type: 'error', error: errorMsg, streamId })
  }
}

async function handleScreenshotRequest(client: MobileClient): Promise<void> {
  try {
    const { takeScreenshot } = await import('../services/automationService')
    const base64 = await takeScreenshot()
    sendToClient(client, { type: 'screenshot', image: base64 })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    sendToClient(client, { type: 'error', error: errorMsg })
  }
}

function handleDisconnect(clientId: string): void {
  clients.delete(clientId)
  console.log(`[Orion Mobile] Cliente desconectado: ${clientId} (${clients.size} conectados)`)
  targetWindow?.send('mobile:client-count', clients.size)
}

function getMobileHTML(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <title>Orion AI - Control Remoto</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root { --bg: #09090B; --surface: #18181B; --border: #27272A; --text: #E4E4E7; --text-dim: #71717A; --accent: #7C3AED; --accent-light: #A78BFA; --user-bg: #6D28D9; --error: #EF4444; --success: #10B981; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); height: 100dvh; display: flex; flex-direction: column; overflow: hidden; -webkit-user-select: none; user-select: none; }
    header { padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--error); transition: background 0.3s; }
    .status-dot.connected { background: var(--success); }
    .status-dot.connecting { background: #F59E0B; animation: pulse 1s infinite; }
    @keyframes pulse { 50% { opacity: 0.5; } }
    header h1 { font-size: 16px; font-weight: 600; }
    header .subtitle { font-size: 11px; color: var(--text-dim); margin-left: auto; }
    .toolbar { display: flex; gap: 8px; padding: 8px 16px; border-bottom: 1px solid var(--border); background: var(--surface); flex-shrink: 0; }
    .toolbar button { flex: 1; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .toolbar button:active { background: var(--accent); border-color: var(--accent); }
    .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; -webkit-overflow-scrolling: touch; }
    .msg { max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-break: break-word; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } }
    .msg.user { align-self: flex-end; background: var(--user-bg); color: white; border-bottom-right-radius: 4px; }
    .msg.assistant { align-self: flex-start; background: var(--surface); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
    .msg.system { align-self: center; background: transparent; color: var(--text-dim); font-size: 12px; padding: 4px 12px; }
    .msg.error { align-self: center; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--error); font-size: 12px; }
    .thinking { display: flex; gap: 4px; padding: 12px 16px; }
    .thinking span { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-light); animation: bounce 1.4s infinite; }
    .thinking span:nth-child(2) { animation-delay: 0.2s; }
    .thinking span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
    .input-area { padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface); flex-shrink: 0; padding-bottom: max(12px, env(safe-area-inset-bottom)); }
    .input-row { display: flex; gap: 8px; align-items: flex-end; }
    .input-row textarea { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 10px 14px; color: var(--text); font-size: 15px; font-family: inherit; resize: none; max-height: 120px; outline: none; transition: border-color 0.2s; -webkit-user-select: text; user-select: text; }
    .input-row textarea:focus { border-color: var(--accent); }
    .input-row button { width: 42px; height: 42px; border-radius: 12px; border: none; background: var(--accent); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: opacity 0.2s; }
    .input-row button:disabled { opacity: 0.4; }
    .input-row button svg { width: 18px; height: 18px; }
    .screenshot-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; flex-direction: column; align-items: center; justify-content: center; padding: 16px; }
    .screenshot-overlay.active { display: flex; }
    .screenshot-overlay img { max-width: 100%; max-height: 80vh; border-radius: 12px; border: 1px solid var(--border); }
    .screenshot-overlay .close-btn { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--surface); color: var(--text); font-size: 20px; cursor: pointer; }
    .screenshot-overlay .refresh-btn { margin-top: 12px; padding: 10px 20px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 14px; cursor: pointer; }
  </style>
</head>
<body>
  <header>
    <div class="status-dot" id="statusDot"></div>
    <h1>Orion AI</h1>
    <span class="subtitle" id="subtitle">Conectando...</span>
  </header>
  <div class="toolbar">
    <button onclick="requestScreenshot()">Ver pantalla PC</button>
    <button onclick="sendQuick('\\u00BFQu\\u00E9 tienes abierto?')">\\u00BFQu\\u00E9 hay abierto?</button>
    <button onclick="sendQuick('Toma un screenshot y descr\\u00EDbelo')">Capturar pantalla</button>
  </div>
  <div class="messages" id="messages">
    <div class="msg system">Conectando con tu PC...</div>
  </div>
  <div class="input-area">
    <div class="input-row">
      <textarea id="input" placeholder="Ej: Abre YouTube..." rows="1" oninput="autoResize(this)"></textarea>
      <button id="sendBtn" onclick="send()" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/></svg>
      </button>
    </div>
  </div>
  <div class="screenshot-overlay" id="screenshotOverlay">
    <button class="close-btn" onclick="closeScreenshot()">&times;</button>
    <img id="screenshotImg" src="" alt="Pantalla de la PC">
    <button class="refresh-btn" onclick="requestScreenshot()">Actualizar</button>
  </div>
  <script>
    let ws=null,reconnectTimer=null;const messagesEl=document.getElementById('messages'),inputEl=document.getElementById('input'),sendBtn=document.getElementById('sendBtn'),statusDot=document.getElementById('statusDot'),subtitle=document.getElementById('subtitle');
    function connect(){const p=location.protocol==='https:'?'wss:':'ws:';ws=new WebSocket(p+'//'+location.host);statusDot.className='status-dot connecting';subtitle.textContent='Conectando...';ws.onopen=()=>{statusDot.className='status-dot connected';subtitle.textContent='Conectado a tu PC';sendBtn.disabled=false;if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=null}};ws.onmessage=e=>{try{handleResponse(JSON.parse(e.data))}catch{}};ws.onclose=()=>{statusDot.className='status-dot';subtitle.textContent='Desconectado';sendBtn.disabled=true;reconnectTimer=setTimeout(connect,3000)};ws.onerror=()=>{}}
    function handleResponse(d){removeThinking();if(d.type==='chat')addMessage('assistant',d.content);else if(d.type==='screenshot')showScreenshot(d.image);else if(d.type==='error')addMessage('error',d.error||'Error');else if(d.type==='status')addMessage('system',d.content)}
    function addMessage(r,c){const d=document.createElement('div');d.className='msg '+r;d.textContent=c;messagesEl.appendChild(d);messagesEl.scrollTop=messagesEl.scrollHeight}
    function addThinking(){const d=document.createElement('div');d.className='thinking';d.id='thinking';d.innerHTML='<span></span><span></span><span></span>';messagesEl.appendChild(d);messagesEl.scrollTop=messagesEl.scrollHeight}
    function removeThinking(){const e=document.getElementById('thinking');if(e)e.remove()}
    function send(){const t=inputEl.value.trim();if(!t||!ws||ws.readyState!==WebSocket.OPEN)return;addMessage('user',t);addThinking();ws.send(JSON.stringify({type:'chat',content:t}));inputEl.value='';inputEl.style.height='auto'}
    function sendQuick(t){if(!ws||ws.readyState!==WebSocket.OPEN)return;addMessage('user',t);addThinking();ws.send(JSON.stringify({type:'chat',content:t}))}
    function requestScreenshot(){if(!ws||ws.readyState!==WebSocket.OPEN)return;addThinking();ws.send(JSON.stringify({type:'screenshot-request'}))}
    function showScreenshot(b){removeThinking();document.getElementById('screenshotImg').src='data:image/jpeg;base64,'+b;document.getElementById('screenshotOverlay').classList.add('active')}
    function closeScreenshot(){document.getElementById('screenshotOverlay').classList.remove('active')}
    function autoResize(e){e.style.height='auto';e.style.height=Math.min(e.scrollHeight,120)+'px';sendBtn.disabled=e.value.trim().length===0}
    inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
    inputEl.addEventListener('input',()=>{sendBtn.disabled=inputEl.value.trim().length===0});
    connect();
  </script>
</body>
</html>`
}

export function getLocalIPForDisplay(): string {
  return getLocalIP()
}

export function getPort(): number {
  return 3847
}

export function getClientCount(): number {
  return clients.size
}

export function getClientsList(): Array<{ id: string; name: string; lastSeen: number }> {
  return Array.from(clients.values()).map((c) => ({
    id: c.id,
    name: c.name,
    lastSeen: c.lastSeen,
  }))
}

export function sendCommandToPhone(
  clientId: string,
  command: string,
): boolean {
  const client = clients.get(clientId)
  if (!client) return false

  sendToClient(client, {
    type: 'chat',
    content: command,
  })
  return true
}

export function broadcastCommandToPhones(command: string): void {
  broadcastToClients({
    type: 'chat',
    content: command,
  })
}

export function startMobileServer(window: WebContents): Promise<{ ip: string; port: number }> {
  return new Promise((resolve, reject) => {
    if (wss) {
      resolve({ ip: getLocalIP(), port: 3847 })
      return
    }

    targetWindow = window

    httpServer = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(getMobileHTML())
      } else if (req.url === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          clients: clients.size,
          ip: getLocalIP(),
          port: 3847,
        }))
      } else {
        res.writeHead(404)
        res.end('Not found')
      }
    })

    wss = new WebSocketServer({ server: httpServer })

    wss.on('connection', (ws, req) => {
      clientCounter++
      const clientId = `phone-${clientCounter}`
      const clientName = req.headers['x-device-name']?.toString() || `Dispositivo ${clientCounter}`

      const client: MobileClient = {
        ws,
        id: clientId,
        name: clientName,
        lastSeen: Date.now(),
      }

      clients.set(clientId, client)
      console.log(`[Orion Mobile] Cliente conectado: ${clientId} - ${clientName} (${clients.size} conectados)`)

      window.send('mobile:client-count', clients.size)

      sendToClient(client, {
        type: 'status',
        content: `Conectado a Orion AI como ${clientName}`,
      })

      ws.on('message', (data) => {
        try {
          const command = JSON.parse(data.toString()) as MobileCommand
          handleMobileCommand(client, command)
        } catch (err) {
          sendToClient(client, { type: 'error', error: 'Comando inválido' })
        }
      })

      ws.on('close', () => handleDisconnect(clientId))
      ws.on('error', () => handleDisconnect(clientId))
    })

    const port = 3847
    httpServer.listen(port, '0.0.0.0', () => {
      const ip = getLocalIP()
      console.log(`[Orion Mobile] Servidor iniciado en http://${ip}:${port}`)
      resolve({ ip, port })
    })

    httpServer.on('error', (err) => {
      console.error('[Orion Mobile] Error del servidor:', err)
      reject(err)
    })
  })
}

export function stopMobileServer(): void {
  if (wss) {
    for (const client of clients.values()) {
      client.ws.close()
    }
    clients.clear()
    wss.close()
    wss = null
  }
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  targetWindow = null
  console.log('[Orion Mobile] Servidor detenido')
}
