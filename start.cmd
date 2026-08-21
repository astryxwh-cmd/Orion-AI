@echo off
rem ==========================================
rem  Orion AI - Inicio en Windows
rem  Limpia ELECTRON_RUN_AS_NODE que puede
rem  estar definida a nivel de usuario y hace
rem  que Electron corra como Node.js puro.
rem ==========================================
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0"
node_modules\.bin\electron .