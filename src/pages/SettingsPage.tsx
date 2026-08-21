import { useEffect, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import {
  Ban,
  Bot,
  Check,
  Eye,
  EyeOff,
  Keyboard,
  Loader2,
  Palette,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

interface SectionHeaderProps {
  icon: LucideIcon
  title: string
  description: string
}

function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-950/50 text-violet-400">
        <Icon size={16} strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">{hint}</p>}
    </div>
  )
}

const INPUT_CLASSES =
  'h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/15'

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-violet-600' : 'bg-zinc-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

const PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'custom', label: 'API compatible (custom)' },
] as const

const PRIVACY_ITEMS = [
  'Las API keys se guardan cifradas con el almacén seguro del sistema operativo.',
  'Las claves nunca se registran en logs ni se muestran en pantalla completa.',
  'Ningún dato se envía a servidores externos salvo las peticiones al proveedor de IA que tú configures.',
  'Orion solo ejecuta acciones en tu equipo cuando tú lo autorizas.',
]

export function SettingsPage() {
  const settings = useSettingsStore((state) => state.settings)
  const apiKeyLoaded = useSettingsStore((state) => state.apiKeyLoaded)
  const hasApiKey = useSettingsStore((state) => state.hasApiKey)
  const updateAI = useSettingsStore((state) => state.updateAI)
  const updateAppearance = useSettingsStore((state) => state.updateAppearance)
  const updateAutomation = useSettingsStore((state) => state.updateAutomation)
  const loadApiKey = useSettingsStore((state) => state.loadApiKey)
  const saveApiKey = useSettingsStore((state) => state.saveApiKey)
  const clearApiKey = useSettingsStore((state) => state.clearApiKey)
  const addToast = useUiStore((state) => state.addToast)

  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [savingKey, setSavingKey] = useState(false)

  useEffect(() => {
    void loadApiKey()
  }, [loadApiKey])

  const handleProviderChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value as 'gemini' | 'openai' | 'openrouter' | 'custom' | ''
    updateAI({ provider: value, model: value ? settings.ai.model : '' })
  }

  const handleSaveApiKey = async (): Promise<void> => {
    if (apiKeyInput.trim().length === 0) {
      return
    }
    setSavingKey(true)
    try {
      await saveApiKey(apiKeyInput)
      setApiKeyInput('')
      addToast('success', 'API key guardada', 'La clave se almacenó cifrada en tu equipo.')
    } catch (error) {
      console.error('[orion] No se pudo guardar la API key:', error)
      addToast('error', 'No se pudo guardar la clave', 'Revisa que el cifrado del sistema esté disponible.')
    } finally {
      setSavingKey(false)
    }
  }

  const handleRemoveApiKey = async (): Promise<void> => {
    try {
      await clearApiKey()
      addToast('info', 'API key eliminada', 'Ya no hay ninguna clave almacenada.')
    } catch (error) {
      console.error('[orion] No se pudo eliminar la API key:', error)
      addToast('error', 'No se pudo eliminar la clave', 'Intenta de nuevo más tarde.')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Configuración" description="Ajusta cómo funciona Orion en tu equipo." />

      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2">
          {/* IA */}
          <SectionCard>
            <SectionHeader
              icon={Bot}
              title="Inteligencia Artificial"
              description="Proveedor, modelo y parámetros de generación."
            />
            <div className="space-y-4">
              <Field label="Proveedor">
                <select
                  value={settings.ai.provider}
                  onChange={handleProviderChange}
                  className={cn(INPUT_CLASSES, 'appearance-none')}
                >
                  <option value="">Selecciona un proveedor</option>
                  {PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Modelo" hint="Ej: gemini-1.5-flash, gpt-4o-mini, o endpoint custom.">
                <input
                  className={INPUT_CLASSES}
                  value={settings.ai.model}
                  onChange={(event) => updateAI({ model: event.target.value })}
                  placeholder="Nombre del modelo"
                />
              </Field>

              {settings.ai.provider === 'custom' && (
                <Field
                  label="URL base"
                  hint="Endpoint compatible con OpenAI (ej. http://localhost:8080/v1)."
                >
                  <input
                    className={INPUT_CLASSES}
                    value={settings.ai.customBaseUrl}
                    onChange={(event) => updateAI({ customBaseUrl: event.target.value })}
                    placeholder="https://api.ejemplo.com/v1"
                  />
                </Field>
              )}

              <Field label="API Key">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className={cn(INPUT_CLASSES, 'pr-16 font-mono')}
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(event) => setApiKeyInput(event.target.value)}
                      placeholder={apiKeyLoaded && hasApiKey ? '•••••••••••• (guardada)' : 'Pega tu API key aquí'}
                      readOnly={apiKeyLoaded && hasApiKey && apiKeyInput.length === 0}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((value) => !value)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                      title={showKey ? 'Ocultar' : 'Mostrar'}
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {apiKeyLoaded && hasApiKey && apiKeyInput.trim().length === 0 ? (
                    <Button variant="danger" size="md" iconLeft={<Trash2 size={14} />} onClick={handleRemoveApiKey}>
                      Eliminar
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSaveApiKey}
                      disabled={apiKeyInput.trim().length === 0 || savingKey}
                      iconLeft={savingKey ? <Loader2Icon /> : <Check size={14} />}
                    >
                      Guardar
                    </Button>
                  )}
                </div>
                {!apiKeyLoaded && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                    <Loader2Icon />
                    Comprobando clave guardada…
                  </div>
                )}
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                  La API key nunca se muestra por completo, no entra en logs y se guarda cifrada
                  con el almacén seguro del sistema.
                </p>
              </Field>

              <Field label="Temperature" hint="Controla la creatividad. Más bajo = más preciso.">
                <RangeField
                  min={0}
                  max={2}
                  step={0.1}
                  value={settings.ai.temperature}
                  onChange={(value) => updateAI({ temperature: value })}
                />
              </Field>

              <Field label="Máximo de tokens">
                <RangeField
                  min={128}
                  max={8192}
                  step={128}
                  value={settings.ai.maxTokens}
                  onChange={(value) => updateAI({ maxTokens: value })}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Apariencia */}
          <SectionCard>
            <SectionHeader
              icon={Palette}
              title="Apariencia"
              description="Tema y comportamiento visual de la interfaz."
            />
            <div className="space-y-3">
              <Toggle
                checked={settings.appearance.animations}
                onChange={(value) => updateAppearance({ animations: value })}
                label="Animaciones de interfaz"
                description="Desactívalas para el máximo rendimiento en equipos modestos."
              />
              <Toggle
                checked={settings.appearance.transparency}
                onChange={(value) => updateAppearance({ transparency: value })}
                label="Transparencia"
                description="Reservado para futuras versiones con ventanas translúcidas."
              />
            </div>
          </SectionCard>

          {/* Automatización */}
          <SectionCard>
            <SectionHeader
              icon={Zap}
              title="Automatización"
              description="Velocidad y seguridad de las acciones controladas."
            />
            <div className="space-y-5">
              <Field label="Velocidad del mouse">
                <RangeField
                  min={1}
                  max={10}
                  step={1}
                  value={settings.automation.mouseSpeed}
                  onChange={(value) => updateAutomation({ mouseSpeed: value })}
                />
              </Field>
              <Field label="Velocidad de escritura">
                <RangeField
                  min={1}
                  max={10}
                  step={1}
                  value={settings.automation.typingSpeed}
                  onChange={(value) => updateAutomation({ typingSpeed: value })}
                />
              </Field>
              <Field label="Delay entre acciones" hint="Evita que Orion actúe de forma instantánea.">
                <RangeField
                  min={0}
                  max={1000}
                  step={50}
                  value={settings.automation.actionDelayMs}
                  onChange={(value) => updateAutomation({ actionDelayMs: value })}
                  suffix=" ms"
                />
              </Field>
              <Toggle
                checked={settings.automation.confirmations}
                onChange={(value) => updateAutomation({ confirmations: value })}
                label="Confirmaciones obligatorias"
                description="Pide permiso antes de cada acción sensible."
              />
            </div>
          </SectionCard>

          {/* Atajos */}
          <SectionCard>
            <SectionHeader
              icon={Keyboard}
              title="Atajos de teclado"
              description="Combinaciones globales de Orion."
            />
            <div className="space-y-3">
              <ShortcutRow
                label="Parada de emergencia"
                value={settings.shortcuts.emergencyStop}
              />
              <ShortcutRow
                label="Nueva conversación"
                value={settings.shortcuts.newConversation}
              />
              <ShortcutRow
                label="Mostrar/Ocultar Orion"
                value={settings.shortcuts.toggleVisibility}
              />
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-800/40 bg-amber-950/20 p-3">
                <Ban size={15} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-xs leading-relaxed text-amber-200/90">
                  La parada de emergencia <span className="font-semibold">Ctrl+Shift+X</span> está
                  siempre activa y detiene cualquier acción automatizada al instante.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Privacidad */}
          <SectionCard className="lg:col-span-2">
            <SectionHeader
              icon={ShieldCheck}
              title="Privacidad"
              description="Cómo usa Orion tu información."
            />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {PRIVACY_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-zinc-300">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5', className)}>
      {children}
    </section>
  )
}

function RangeField({
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-violet-500"
      />
      <span className="w-20 shrink-0 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-center font-mono text-xs text-violet-300">
        {Number.isInteger(value) ? value : value.toFixed(1)}
        {suffix ?? ''}
      </span>
    </div>
  )
}

function ShortcutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <kbd className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 font-mono text-xs text-violet-300">
        {value}
      </kbd>
    </div>
  )
}

function Loader2Icon() {
  return <Loader2 size={14} className="animate-spin" />
}