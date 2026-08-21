import {
  mouseMove,
  mouseClick,
  mouseScroll,
  getMousePosition,
  keyboardType,
  keyboardPress,
  takeScreenshot,
  getScreenSize,
} from './automationService'
import {
  readFile,
  writeFile,
  listDirectory,
  fileExists,
  getFileInfo,
} from './fileSystemService'
import {
  runCommand,
  openApplication,
  openUrl,
  openFolder,
  getEnvironmentInfo,
} from './commandService'
import {
  takeScreenshot as phoneScreenshot,
  tap as phoneTap,
  swipe as phoneSwipe,
  typeText as phoneType,
  pressKey as phoneKey,
  openApp as phoneOpenApp,
  listInstalledApps as phoneListApps,
  getCurrentActivity as phoneCurrentApp,
  connectAdbTcp as phoneConnect,
} from '../adb/adbService'

export interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  toolName: string
  result: string
  image?: string
  error?: boolean
}

export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  const { name, args } = toolCall

  try {
    switch (name) {
      case 'mouse_move': {
        const result = await mouseMove({
          x: Number(args.x),
          y: Number(args.y),
        })
        return { toolName: name, result }
      }

      case 'mouse_click': {
        const result = await mouseClick({
          button: (args.button as 'left' | 'right' | 'middle') ?? 'left',
          double: Boolean(args.double),
        })
        return { toolName: name, result }
      }

      case 'mouse_scroll': {
        const result = await mouseScroll({
          direction: (args.direction as 'up' | 'down' | 'left' | 'right') ?? 'down',
          amount: args.amount ? Number(args.amount) : undefined,
        })
        return { toolName: name, result }
      }

      case 'mouse_get_position': {
        const result = await getMousePosition()
        return { toolName: name, result }
      }

      case 'keyboard_type': {
        const result = await keyboardType({
          text: String(args.text),
        })
        return { toolName: name, result }
      }

      case 'keyboard_press': {
        const keys = Array.isArray(args.keys) ? args.keys.map(String) : []
        const result = await keyboardPress({ keys })
        return { toolName: name, result }
      }

      case 'take_screenshot': {
        const image = await takeScreenshot()
        return {
          toolName: name,
          result: 'Screenshot capturado. Imagen disponible para análisis.',
          image,
        }
      }

      case 'get_screen_size': {
        const result = await getScreenSize()
        return { toolName: name, result }
      }

      case 'read_file': {
        const result = await readFile({ path: String(args.path) })
        return { toolName: name, result }
      }

      case 'write_file': {
        const result = await writeFile({
          path: String(args.path),
          content: String(args.content),
          append: Boolean(args.append),
        })
        return { toolName: name, result }
      }

      case 'list_directory': {
        const result = await listDirectory({
          path: String(args.path),
          recursive: Boolean(args.recursive),
        })
        return { toolName: name, result }
      }

      case 'file_exists': {
        const result = await fileExists({ path: String(args.path) })
        return { toolName: name, result }
      }

      case 'get_file_info': {
        const result = await getFileInfo({ path: String(args.path) })
        return { toolName: name, result }
      }

      case 'run_command': {
        const result = await runCommand({
          command: String(args.command),
          cwd: args.cwd ? String(args.cwd) : undefined,
          timeout: args.timeout ? Number(args.timeout) : undefined,
        })
        return { toolName: name, result }
      }

      case 'open_application': {
        const argsList = Array.isArray(args.args) ? args.args.map(String) : []
        const result = await openApplication({
          target: String(args.target),
          args: argsList,
        })
        return { toolName: name, result }
      }

      case 'open_url': {
        const result = await openUrl({ url: String(args.url) })
        return { toolName: name, result }
      }

      case 'open_folder': {
        const result = await openFolder({ path: String(args.path) })
        return { toolName: name, result }
      }

      case 'get_environment_info': {
        const result = await getEnvironmentInfo()
        return { toolName: name, result }
      }

      case 'phone_screenshot': {
        const image = await phoneScreenshot(args.device_id ? String(args.device_id) : undefined)
        return {
          toolName: name,
          result: 'Screenshot del teléfono capturado.',
          image,
        }
      }

      case 'phone_tap': {
        const result = await phoneTap(
          Number(args.x), Number(args.y),
          args.device_id ? String(args.device_id) : undefined,
        )
        return { toolName: name, result }
      }

      case 'phone_swipe': {
        const result = await phoneSwipe(
          Number(args.x1), Number(args.y1), Number(args.x2), Number(args.y2),
          args.duration_ms ? Number(args.duration_ms) : undefined,
          args.device_id ? String(args.device_id) : undefined,
        )
        return { toolName: name, result }
      }

      case 'phone_type': {
        const result = await phoneType(
          String(args.text),
          args.device_id ? String(args.device_id) : undefined,
        )
        return { toolName: name, result }
      }

      case 'phone_key': {
        const result = await phoneKey(
          String(args.key),
          args.device_id ? String(args.device_id) : undefined,
        )
        return { toolName: name, result }
      }

      case 'phone_open_app': {
        const result = await phoneOpenApp(
          String(args.package),
          args.device_id ? String(args.device_id) : undefined,
        )
        return { toolName: name, result }
      }

      case 'phone_list_apps': {
        const apps = await phoneListApps(
          args.device_id ? String(args.device_id) : undefined,
        )
        return { toolName: name, result: apps.join('\n') || 'No se encontraron apps' }
      }

      case 'phone_current_app': {
        const result = await phoneCurrentApp(
          args.device_id ? String(args.device_id) : undefined,
        )
        return { toolName: name, result: `App activa: ${result}` }
      }

      case 'phone_connect': {
        const result = await phoneConnect(
          String(args.ip),
          args.port ? Number(args.port) : undefined,
        )
        return { toolName: name, result }
      }

      default:
        return {
          toolName: name,
          result: `Herramienta desconocida: ${name}`,
          error: true,
        }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      toolName: name,
      result: `Error al ejecutar ${name}: ${message}`,
      error: true,
    }
  }
}
