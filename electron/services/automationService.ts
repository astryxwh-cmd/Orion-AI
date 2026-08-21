import { mouse, keyboard, screen, Point, Key, Button } from '@nut-tree-fork/nut-js'
import screenshotDesktop from 'screenshot-desktop'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

const screenshotDir = path.join(app.getPath('temp'), 'orion-screenshots')

function ensureScreenshotDir(): void {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }
}

export interface MouseMoveParams {
  x: number
  y: number
}

export interface MouseClickParams {
  button?: 'left' | 'right' | 'middle'
  double?: boolean
}

export interface MouseScrollParams {
  direction: 'up' | 'down' | 'left' | 'right'
  amount?: number
}

export interface KeyboardTypeParams {
  text: string
}

export interface KeyboardPressParams {
  keys: string[]
}

export async function mouseMove(params: MouseMoveParams): Promise<string> {
  await mouse.setPosition(new Point(params.x, params.y))
  return `Cursor movido a (${params.x}, ${params.y})`
}

export async function mouseClick(params: MouseClickParams = {}): Promise<string> {
  const button = params.button ?? 'left'

  if (params.double) {
    await mouse.doubleClick(button === 'left' ? Button.LEFT : button === 'right' ? Button.RIGHT : Button.MIDDLE)
    return `Doble click ${button}`
  }

  await mouse.click(button === 'left' ? Button.LEFT : button === 'right' ? Button.RIGHT : Button.MIDDLE)
  return `Click ${button}`
}

export async function mouseScroll(params: MouseScrollParams): Promise<string> {
  const amount = params.amount ?? 3

  switch (params.direction) {
    case 'up':
      await mouse.scrollUp(amount)
      break
    case 'down':
      await mouse.scrollDown(amount)
      break
    case 'left':
      await mouse.scrollLeft(amount)
      break
    case 'right':
      await mouse.scrollRight(amount)
      break
  }

  return `Scroll ${params.direction} ${amount} pasos`
}

export async function mouseGetPosition(): Promise<string> {
  const pos = await mouse.getPosition()
  return JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) })
}

const KEY_MAP: Record<string, Key> = {
  enter: Key.Enter,
  return: Key.Return,
  tab: Key.Tab,
  space: Key.Space,
  backspace: Key.Backspace,
  delete: Key.Delete,
  escape: Key.Escape,
  esc: Key.Escape,
  up: Key.Up,
  down: Key.Down,
  left: Key.Left,
  right: Key.Right,
  home: Key.Home,
  end: Key.End,
  pageup: Key.PageUp,
  pagedown: Key.PageDown,
  insert: Key.Insert,
  capslock: Key.CapsLock,
  numlock: Key.NumLock,
  printscreen: Key.Print,
  f1: Key.F1,
  f2: Key.F2,
  f3: Key.F3,
  f4: Key.F4,
  f5: Key.F5,
  f6: Key.F6,
  f7: Key.F7,
  f8: Key.F8,
  f9: Key.F9,
  f10: Key.F10,
  f11: Key.F11,
  f12: Key.F12,
  ctrl: Key.LeftControl,
  control: Key.LeftControl,
  shift: Key.LeftShift,
  alt: Key.LeftAlt,
  meta: Key.LeftSuper,
  win: Key.LeftSuper,
  command: Key.LeftSuper,
  ctrl_l: Key.LeftControl,
  ctrl_r: Key.RightControl,
  shift_l: Key.LeftShift,
  shift_r: Key.RightShift,
  alt_l: Key.LeftAlt,
  alt_r: Key.RightAlt,
  minus: Key.Minus,
  equal: Key.Equal,
  comma: Key.Comma,
  period: Key.Period,
  slash: Key.Slash,
  backslash: Key.Backslash,
  semicolon: Key.Semicolon,
  quote: Key.Quote,
  leftbracket: Key.LeftBracket,
  rightbracket: Key.RightBracket,
  grave: Key.Grave,
  a: Key.A,
  b: Key.B,
  c: Key.C,
  d: Key.D,
  e: Key.E,
  f: Key.F,
  g: Key.G,
  h: Key.H,
  i: Key.I,
  j: Key.J,
  k: Key.K,
  l: Key.L,
  m: Key.M,
  n: Key.N,
  o: Key.O,
  p: Key.P,
  q: Key.Q,
  r: Key.R,
  s: Key.S,
  t: Key.T,
  u: Key.U,
  v: Key.V,
  w: Key.W,
  x: Key.X,
  y: Key.Y,
  z: Key.Z,
  '0': Key.Num0,
  '1': Key.Num1,
  '2': Key.Num2,
  '3': Key.Num3,
  '4': Key.Num4,
  '5': Key.Num5,
  '6': Key.Num6,
  '7': Key.Num7,
  '8': Key.Num8,
  '9': Key.Num9,
}

function resolveKey(name: string): Key | null {
  const lower = name.toLowerCase()
  if (KEY_MAP[lower] !== undefined) {
    return KEY_MAP[lower]
  }
  if (lower.length === 1) {
    const upper = lower.toUpperCase()
    const letterKey = KEY_MAP[upper]
    if (letterKey !== undefined) {
      return letterKey
    }
  }
  return null
}

export async function keyboardType(params: KeyboardTypeParams): Promise<string> {
  await keyboard.type(params.text)
  return `Texto escrito: "${params.text.slice(0, 50)}${params.text.length > 50 ? '...' : ''}"`
}

export async function keyboardPress(params: KeyboardPressParams): Promise<string> {
  const keys: Key[] = []
  for (const raw of params.keys) {
    const resolved = resolveKey(raw)
    if (resolved === null) {
      throw new Error(`Tecla no reconocida: "${raw}". Usa nombres como: enter, tab, space, ctrl, shift, alt, a-z, 0-9, f1-f12, up, down, left, right, etc.`)
    }
    keys.push(resolved)
  }

  await keyboard.pressKey(...keys)
  await keyboard.releaseKey(...keys)

  return `Tecla(s) presionada(s): ${params.keys.join(' + ')}`
}

export async function takeScreenshot(): Promise<string> {
  ensureScreenshotDir()
  const timestamp = Date.now()
  const filePath = path.join(screenshotDir, `orion-${timestamp}.jpg`)

  await screenshotDesktop({
    filename: filePath,
    format: 'jpg',
  })

  const buffer = fs.readFileSync(filePath)
  console.log(`[Orion] Screenshot captured: ${buffer.length} bytes`)

  let finalBuffer = buffer
  if (buffer.length > 500_000) {
    try {
      const Jimp = (await import('jimp')).default as any
      const image = await Jimp.read(buffer)
      const ratio = Math.sqrt(500_000 / buffer.length)
      const newW = Math.round(image.bitmap.width * ratio)
      const newH = Math.round(image.bitmap.height * ratio)
      image.resize(newW, newH)
      image.quality(70)
      finalBuffer = Buffer.from(await image.getBufferAsync(Jimp.MIME_JPEG as string))
      console.log(`[Orion] Compressed to ${finalBuffer.length} bytes (${newW}x${newH})`)
    } catch (err) {
      console.warn('[Orion] Compression failed, using original:', err)
    }
  }

  const base64 = finalBuffer.toString('base64')
  console.log(`[Orion] Base64 length: ${base64.length}`)

  try {
    fs.unlinkSync(filePath)
  } catch {
    // ignore cleanup errors
  }

  return base64
}

export async function getScreenSize(): Promise<string> {
  const width = await screen.width()
  const height = await screen.height()
  return JSON.stringify({ width, height })
}

export async function getMousePosition(): Promise<string> {
  const pos = await mouse.getPosition()
  return JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) })
}

export function setMouseSpeed(speed: number): void {
  const pixelsPerSecond = 500 + (speed - 1) * 272
  mouse.config.mouseSpeed = pixelsPerSecond
}

export function setKeyDelay(ms: number): void {
  keyboard.config.autoDelayMs = ms
}

export function setMouseDelay(ms: number): void {
  mouse.config.autoDelayMs = ms
}
