'use strict'

/**
 * Lanzador de Electron para `npm start`.
 *
 * El entorno del host (por ejemplo VS Code) puede inyectar
 * ELECTRON_RUN_AS_NODE=1, lo que fuerza a Electron a arrancar como Node.
 * Borramos la variable antes de lanzar el binario para garantizar que
 * Electron arranque como aplicación de escritorio.
 */
const { spawnSync } = require('child_process')
const path = require('path')

delete process.env.ELECTRON_RUN_AS_NODE

const electronPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'electron',
  'dist',
  'electron.exe',
)

const result = spawnSync(electronPath, ['.'], { stdio: 'inherit' })
process.exitCode = result.status ?? 0