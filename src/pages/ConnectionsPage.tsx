import { useEffect, useState, useCallback } from 'react'
import { Smartphone, Wifi, Usb, Copy, QrCode, RefreshCw, WifiOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const { orion } = window as any

type Tab = 'wifi' | 'adb'

interface MobileStatus {
  running: boolean
  ip: string
  port: number
  clients: number
  clientsList: Array<{ id: string; name: string; lastSeen: number }>
}

interface AdbDevice {
  id: string
  status: string
  model?: string
}

export function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>('wifi')
  const [mobileStatus, setMobileStatus] = useState<MobileStatus | null>(null)
  const [mobileLoading, setMobileLoading] = useState(false)
  const [adbInstalled, setAdbInstalled] = useState<boolean | null>(null)
  const [adbDevices, setAdbDevices] = useState<AdbDevice[]>([])
  const [adbConnecting, setAdbConnecting] = useState(false)
  const [connectIp, setConnectIp] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshMobileStatus = useCallback(async () => {
    try {
      const status = await orion.mobile.status()
      setMobileStatus(status)
    } catch {}
  }, [])

  const checkAdb = useCallback(async () => {
    try {
      const result = await orion.adb.check()
      setAdbInstalled(result.installed)
      if (result.installed) {
        const devicesResult = await orion.adb.devices()
        if (devicesResult.success) {
          setAdbDevices(devicesResult.devices || [])
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    refreshMobileStatus()
    checkAdb()

    const unsub = orion.mobile.onClientCount(() => {
      refreshMobileStatus()
    })
    return unsub
  }, [refreshMobileStatus, checkAdb])

  const toggleMobileServer = async () => {
    setMobileLoading(true)
    setError(null)
    try {
      if (mobileStatus?.running) {
        await orion.mobile.stop()
      } else {
        const result = await orion.mobile.start()
        if (!result.success) {
          setError(result.error || 'Error al iniciar servidor')
        }
      }
      await refreshMobileStatus()
    } catch (err) {
      setError(String(err))
    }
    setMobileLoading(false)
  }

  const copyUrl = () => {
    if (mobileStatus?.ip && mobileStatus?.port) {
      navigator.clipboard.writeText(`http://${mobileStatus.ip}:${mobileStatus.port}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const connectAdbDevice = async () => {
    if (!connectIp.trim()) return
    setAdbConnecting(true)
    setError(null)
    try {
      const result = await orion.adb.connect(connectIp.trim())
      if (result.success) {
        setConnectIp('')
        await checkAdb()
      } else {
        setError(result.error || 'Error al conectar')
      }
    } catch (err) {
      setError(String(err))
    }
    setAdbConnecting(false)
  }

  const refreshAdbDevices = async () => {
    setError(null)
    try {
      const result = await orion.adb.devices()
      if (result.success) {
        setAdbDevices(result.devices || [])
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center border-b border-zinc-800/70 px-4">
        <h2 className="text-sm font-semibold">Celular</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab('wifi')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'wifi' ? 'bg-violet-600 text-white' : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wifi size={16} />
            WiFi
          </button>
          <button
            onClick={() => setTab('adb')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'adb' ? 'bg-violet-600 text-white' : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Usb size={16} />
            USB (ADB)
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* WiFi Tab */}
        {tab === 'wifi' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Servidor de Control Remoto</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Desde tu celular, abrí el navegador y conectate a tu PC
                  </p>
                </div>
                <button
                  onClick={toggleMobileServer}
                  disabled={mobileLoading}
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    mobileStatus?.running ? 'bg-violet-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                      mobileStatus?.running ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {mobileStatus?.running && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-3">
                    <QrCode size={40} className="text-zinc-600" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Abrí en tu celular:</p>
                      <p className="font-mono text-sm font-semibold text-violet-400">
                        http://{mobileStatus.ip}:{mobileStatus.port}
                      </p>
                    </div>
                    <button
                      onClick={copyUrl}
                      className="rounded-lg bg-zinc-700 p-2 hover:bg-zinc-600 transition-colors"
                    >
                      {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${mobileStatus.clients > 0 ? 'bg-green-400' : 'bg-zinc-600'}`} />
                      {mobileStatus.clients} {mobileStatus.clients === 1 ? 'dispositivo conectado' : 'dispositivos conectados'}
                    </span>
                    <button onClick={refreshMobileStatus} className="flex items-center gap-1 hover:text-zinc-300">
                      <RefreshCw size={12} />
                      Actualizar
                    </button>
                  </div>

                  {mobileStatus.clientsList.length > 0 && (
                    <div className="space-y-2">
                      {mobileStatus.clientsList.map((client) => (
                        <div key={client.id} className="flex items-center gap-2 rounded-lg bg-zinc-800/30 px-3 py-2 text-xs">
                          <Smartphone size={14} className="text-zinc-500" />
                          <span className="font-medium text-zinc-300">{client.name}</span>
                          <span className="ml-auto text-zinc-600">{client.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!mobileStatus?.running && (
                <div className="mt-4 rounded-lg bg-zinc-800/30 p-4 text-center text-xs text-zinc-600">
                  <WifiOff size={24} className="mx-auto mb-2 text-zinc-700" />
                  Servidor apagado. Activalo para conectar tu celular.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-4">
              <h4 className="text-xs font-semibold text-zinc-400">Cómo funciona</h4>
              <ol className="mt-2 space-y-2 text-xs text-zinc-500">
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-[10px] font-bold text-violet-400">1</span>
                  Activá el servidor arriba
                </li>
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-[10px] font-bold text-violet-400">2</span>
                  Abrí la URL en el navegador de tu celular
                </li>
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-[10px] font-bold text-violet-400">3</span>
                  Pedile a la IA que haga cosas en tu PC
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* ADB Tab */}
        {tab === 'adb' && (
          <div className="space-y-6">
            {adbInstalled === false && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5">
                <h3 className="text-sm font-semibold text-yellow-400">ADB no está instalado</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Descargá ADB desde developer.android.com y agregalo al PATH del sistema.
                </p>
              </div>
            )}

            {adbInstalled === true && (
              <>
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Dispositivos Conectados</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Controlá tu celular directamente desde la PC
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={refreshAdbDevices}>
                      <RefreshCw size={14} />
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {adbDevices.length === 0 ? (
                      <div className="rounded-lg bg-zinc-800/30 p-4 text-center text-xs text-zinc-600">
                        <Usb size={24} className="mx-auto mb-2 text-zinc-700" />
                        No hay dispositivos conectados. Conectá tu celular por USB o WiFi.
                      </div>
                    ) : (
                      adbDevices.map((device) => (
                        <div key={device.id} className="flex items-center gap-3 rounded-lg bg-zinc-800/40 px-4 py-3">
                          <Smartphone size={18} className="text-violet-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{device.model || device.id}</p>
                            <p className="text-xs text-zinc-500">{device.id}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            device.status === 'device' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {device.status === 'device' ? 'Conectado' : device.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5">
                  <h3 className="text-sm font-semibold">Conectar por WiFi</h3>
                  <p className="mt-1 text-xs text-zinc-500 mb-3">
                    Primero conectá por USB, después podés pasar a WiFi
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="IP del celular (ej: 192.168.1.100)"
                      value={connectIp}
                      onChange={(e) => setConnectIp(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && connectAdbDevice()}
                      className="flex-1 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none border border-zinc-700/50 focus:border-violet-500/50"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={connectAdbDevice}
                      disabled={!connectIp.trim() || adbConnecting}
                    >
                      {adbConnecting ? <Loader2 size={14} className="animate-spin" /> : 'Conectar'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-4">
              <h4 className="text-xs font-semibold text-zinc-400">Cómo funciona</h4>
              <ol className="mt-2 space-y-2 text-xs text-zinc-500">
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-[10px] font-bold text-violet-400">1</span>
                  Activá "Depuración USB" en Opciones de desarrollador de tu celular
                </li>
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-[10px] font-bold text-violet-400">2</span>
                  Conectá el celular por USB y aceptá la depuración
                </li>
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-[10px] font-bold text-violet-400">3</span>
                  Pedile a la IA que abra apps, tome screenshots, etc.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
