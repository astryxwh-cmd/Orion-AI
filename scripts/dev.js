'use strict'

/**
 * Lanzador de desarrollo para `npm run dev`.
 *
 * Vite (y por tanto vite-plugin-electron) heredaría ELECTRON_RUN_AS_NODE=1
 * del entorno del host, lo que provocaría que el proceso Electron lanzado
 * por el plugin arranque en modo Node. Borramos la variable antes de
 * iniciar Vite para que todo el árbol de procesos herede un entorno limpio.
 */
const { spawnSync } = require('child_process')
const path = require('path')

delete process.env.ELECTRON_RUN_AS_NODE

const vitePath = path.join(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js')

const result = spawnSync(process.execPath, [vitePath], { stdio: 'inherit' })
process.exitCode = result.status ?? 0