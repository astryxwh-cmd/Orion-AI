export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, ToolParameter>
    required?: string[]
  }
}

export interface ToolParameter {
  type: string
  description: string
  enum?: string[]
  items?: { type: string }
  properties?: Record<string, ToolParameter>
}

export const ORION_TOOLS: ToolDefinition[] = [
  {
    name: 'mouse_move',
    description: 'Mueve el cursor del mouse a una posición específica en la pantalla. Usa coordenadas en píxeles desde la esquina superior izquierda.',
    parameters: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Coordenada X horizontal en píxeles' },
        y: { type: 'number', description: 'Coordenada Y vertical en píxeles' },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'mouse_click',
    description: 'Realiza un click con el mouse en la posición actual del cursor.',
    parameters: {
      type: 'object',
      properties: {
        button: {
          type: 'string',
          description: 'Botón del mouse a presionar',
          enum: ['left', 'right', 'middle'],
        },
        double: {
          type: 'boolean',
          description: 'Si es true, realiza doble click',
        },
      },
    },
  },
  {
    name: 'mouse_scroll',
    description: 'Desplaza la rueda del mouse en la dirección indicada.',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          description: 'Dirección del scroll',
          enum: ['up', 'down', 'left', 'right'],
        },
        amount: {
          type: 'number',
          description: 'Cantidad de pasos de scroll (default: 3)',
        },
      },
      required: ['direction'],
    },
  },
  {
    name: 'mouse_get_position',
    description: 'Obtiene la posición actual del cursor del mouse en coordenadas x, y.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'keyboard_type',
    description: 'Escribe un texto como si fuera un teclado. Simula la escritura carácter por carácter.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'El texto a escribir',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'keyboard_press',
    description: 'Presiona una o varias teclas simultáneamente (como atajos de teclado). Ejemplos: Ctrl+C, Enter, Alt+Tab.',
    parameters: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de teclas a presionar simultáneamente. Ej: ["ctrl", "c"] para copiar, ["enter"] para Enter.',
        },
      },
      required: ['keys'],
    },
  },
  {
    name: 'take_screenshot',
    description: 'Captura una imagen de la pantalla completa. Retorna la imagen en base64 para que puedas analizar qué hay en la pantalla.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_screen_size',
    description: 'Obtiene el tamaño de la pantalla en píxeles (ancho y alto).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'read_file',
    description: 'Lee el contenido de un archivo de texto. Útil para ver el contenido de archivos como código, configuraciones, notas, etc.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Ruta completa del archivo a leer',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Escribe contenido en un archivo. Si el archivo no existe, lo crea. Si existe, lo sobrescribe (a menos que se use append).',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Ruta completa del archivo a escribir',
        },
        content: {
          type: 'string',
          description: 'Contenido a escribir en el archivo',
        },
        append: {
          type: 'boolean',
          description: 'Si es true, añade el contenido al final del archivo en lugar de sobrescribirlo',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_directory',
    description: 'Lista el contenido de un directorio, mostrando archivos y subcarpetas.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Ruta del directorio a listar',
        },
        recursive: {
          type: 'boolean',
          description: 'Si es true, lista también el contenido de subcarpetas',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'file_exists',
    description: 'Verifica si un archivo o directorio existe en la ruta especificada.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Ruta a verificar',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_file_info',
    description: 'Obtiene información detallada de un archivo: tamaño, fecha de creación, modificación, etc.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Ruta del archivo',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_command',
    description: 'Ejecuta un comando del sistema operativo. Útil para ejecutar scripts, comandos de git, npm, etc.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'El comando a ejecutar',
        },
        cwd: {
          type: 'string',
          description: 'Directorio de trabajo donde ejecutar el comando (opcional)',
        },
        timeout: {
          type: 'number',
          description: 'Tiempo máximo de ejecución en milisegundos (default: 30000)',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'open_application',
    description: 'Abre una aplicación o archivo con el programa predeterminado del sistema.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Ruta de la aplicación o archivo a abrir',
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Argumentos adicionales para la aplicación',
        },
      },
      required: ['target'],
    },
  },
  {
    name: 'open_url',
    description: 'Abre una URL en el navegador web predeterminado del sistema.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'La URL a abrir',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'open_folder',
    description: 'Abre una carpeta en el explorador de archivos del sistema.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Ruta de la carpeta a abrir',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_environment_info',
    description: 'Obtiene información del entorno del sistema: plataforma, rutas importantes (escritorio, documentos, descargas, etc).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'phone_screenshot',
    description: 'Captura la pantalla del teléfono conectado por ADB. Retorna la imagen en base64.',
    parameters: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ID del dispositivo ADB (opcional si solo hay uno conectado)' },
      },
    },
  },
  {
    name: 'phone_tap',
    description: 'Toca una posición en la pantalla del teléfono.',
    parameters: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Coordenada X' },
        y: { type: 'number', description: 'Coordenada Y' },
        device_id: { type: 'string', description: 'ID del dispositivo ADB (opcional)' },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'phone_swipe',
    description: 'Realiza un gesto de deslizar en la pantalla del teléfono.',
    parameters: {
      type: 'object',
      properties: {
        x1: { type: 'number', description: 'X inicial' },
        y1: { type: 'number', description: 'Y inicial' },
        x2: { type: 'number', description: 'X final' },
        y2: { type: 'number', description: 'Y final' },
        duration_ms: { type: 'number', description: 'Duración en ms (default: 300)' },
        device_id: { type: 'string', description: 'ID del dispositivo ADB (opcional)' },
      },
      required: ['x1', 'y1', 'x2', 'y2'],
    },
  },
  {
    name: 'phone_type',
    description: 'Escribe texto en el teléfono.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Texto a escribir' },
        device_id: { type: 'string', description: 'ID del dispositivo ADB (opcional)' },
      },
      required: ['text'],
    },
  },
  {
    name: 'phone_key',
    description: 'Presiona una tecla del teléfono (enter, back, home, volumeup, etc).',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Nombre de la tecla: enter, back, home, volumeup, volumedown, power, tab, delete, space, up, down, left, right' },
        device_id: { type: 'string', description: 'ID del dispositivo ADB (opcional)' },
      },
      required: ['key'],
    },
  },
  {
    name: 'phone_open_app',
    description: 'Abre una aplicación en el teléfono por su nombre de paquete.',
    parameters: {
      type: 'object',
      properties: {
        package: { type: 'string', description: 'Nombre del paquete (ej: com.google.android.youtube, com.instagram.android)' },
        device_id: { type: 'string', description: 'ID del dispositivo ADB (opcional)' },
      },
      required: ['package'],
    },
  },
  {
    name: 'phone_list_apps',
    description: 'Lista las aplicaciones instaladas en el teléfono.',
    parameters: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ID del dispositivo ADB (opcional)' },
      },
    },
  },
  {
    name: 'phone_current_app',
    description: 'Obtiene la aplicación que está actualmente abierta en el teléfono.',
    parameters: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ID del dispositivo ADB (opcional)' },
      },
    },
  },
  {
    name: 'phone_connect',
    description: 'Conecta a un teléfono por ADB via WiFi (IP:puerto).',
    parameters: {
      type: 'object',
      properties: {
        ip: { type: 'string', description: 'IP del teléfono' },
        port: { type: 'number', description: 'Puerto ADB (default: 5555)' },
      },
      required: ['ip'],
    },
  },
]

export function getToolByName(name: string): ToolDefinition | undefined {
  return ORION_TOOLS.find((tool) => tool.name === name)
}

export function getToolNames(): string[] {
  return ORION_TOOLS.map((tool) => tool.name)
}
