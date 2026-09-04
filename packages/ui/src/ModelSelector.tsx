import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { AiProviderId, AiSettings } from '@genoffice/ai-provider'
import './model-selector.css'

export interface ModelSelectorProps {
  settings?: AiSettings | null
  onModelChange?: (model: string, provider?: AiProviderId) => void
  className?: string
}

const OLLAMA_PRESETS = [
  'llama3.2',
  'qwen2.5-coder',
  'deepseek-r1',
  'llama3.1',
  'qwen2.5',
  'mistral',
  'gemma2',
  'phi4',
]

export function ModelSelector({
  settings,
  onModelChange,
  className,
}: ModelSelectorProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [localModels, setLocalModels] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const config = settings?.providers?.ollama
  const baseUrl = config?.baseUrl || 'http://localhost:11434/v1'
  const currentModel = config?.model || 'llama3.2'

  // Probes Ollama to list pre-installed models and determine online state
  const detectLocalModels = useCallback(
    async (autoSelect = false) => {
      setDetecting(true)
      setStatusMessage('Checking Ollama server...')
      try {
        let models: string[] = []
        const win = window as any
        const listFn =
          win.desktop?.listLocalModels ||
          win.desktopApi?.listLocalModels ||
          win.slidesApi?.listLocalModels ||
          win.aiOffice?.listLocalModels

        if (typeof listFn === 'function') {
          try {
            models = await listFn(baseUrl)
          } catch {
            models = []
          }
        }

        // Direct fetch fallback if listFn returned empty or is not defined
        if (models.length === 0) {
          try {
            const rawBase = baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '')
            const res = await fetch(`${rawBase}/api/tags`, { method: 'GET' }).catch(() => null)
            if (res && res.ok) {
              const data = (await res.json()) as {
                models?: Array<{ name?: string; model?: string }>
              }
              if (Array.isArray(data.models)) {
                models = data.models.map((m) => m.name || m.model || '').filter(Boolean)
              }
            }
          } catch {
            /* ignore */
          }
        }

        if (models.length > 0) {
          setIsOnline(true)
          setLocalModels(models)
          setStatusMessage(`${models.length} model${models.length === 1 ? '' : 's'} installed`)
          if (autoSelect || !models.includes(currentModel)) {
            if (models[0]) onModelChange?.(models[0], 'ollama')
          }
        } else {
          // Probe if base url responds to check if server is running
          let serverUp = false
          try {
            const rawBase = baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '')
            const pingRes = await fetch(`${rawBase}/`, { method: 'GET' }).catch(() => null)
            if (pingRes && (pingRes.ok || pingRes.status === 200)) {
              serverUp = true
            }
          } catch {
            serverUp = false
          }

          if (serverUp) {
            setIsOnline(true)
            setLocalModels([])
            setStatusMessage('Ollama running (no models pulled yet)')
          } else {
            setIsOnline(false)
            setStatusMessage('Ollama offline (run: ollama serve)')
          }
        }
      } catch {
        setIsOnline(false)
        setStatusMessage('Ollama server not reachable')
      } finally {
        setDetecting(false)
      }
    },
    [baseUrl, currentModel, onModelChange],
  )

  // Initial detection
  useEffect(() => {
    void detectLocalModels(false)
  }, [detectLocalModels])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [open])

  const selectModel = (model: string) => {
    onModelChange?.(model, 'ollama')
    setOpen(false)
    setShowCustomInput(false)
  }

  const applyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = customInput.trim()
    if (trimmed) {
      selectModel(trimmed)
      setCustomInput('')
    }
  }

  const statusClass = detecting ? 'detecting' : isOnline ? 'online' : 'offline'

  return (
    <div ref={wrapRef} className={`ai-model-selector ${className ?? ''}`}>
      <button
        type="button"
        className={`ai-model-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        title={`Ollama Local AI: ${currentModel} (${isOnline ? 'Online' : 'Offline'})`}
        aria-label="Select AI model"
        aria-expanded={open}
      >
        <span className={`ai-model-status-dot ${statusClass}`} aria-hidden="true" />
        <span className="ai-model-label" title={currentModel}>
          {currentModel}
        </span>
        <span className="ai-model-chip">Ollama</span>
        <svg
          className="ai-model-caret"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 3.75L5 6.25L7.5 3.75"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="ai-model-dropdown" role="dialog" aria-label="Available Ollama models">
          {/* Header */}
          <div className="ai-model-dropdown-header">
            <div className="ai-model-dropdown-title">
              <span className="ai-model-title-text">Ollama (Local AI)</span>
              <span className={`ai-model-status-pill ${statusClass}`}>
                {detecting ? 'Checking…' : isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <button
              type="button"
              className="ai-model-refresh-btn"
              onClick={() => void detectLocalModels(false)}
              disabled={detecting}
              title="Refresh models from local Ollama server"
            >
              {detecting ? '…' : '🔄 Refresh'}
            </button>
          </div>

          {/* Status notification bar if any */}
          {statusMessage && (
            <div className={`ai-model-status-bar ${isOnline ? 'ok' : 'warn'}`}>{statusMessage}</div>
          )}

          {/* Offline troubleshooting helper card */}
          {isOnline === false && !detecting && (
            <div className="ai-model-offline-banner">
              <div className="ai-model-offline-title">
                <span className="ai-model-offline-icon">⚠️</span>
                <span>Ollama server is offline</span>
              </div>
              <div className="ai-model-offline-desc">Start Ollama in your terminal:</div>
              <div className="ai-model-offline-code">
                <code>ollama serve</code>
              </div>
              <button
                type="button"
                className="ai-model-offline-retry"
                onClick={() => void detectLocalModels(false)}
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Models list */}
          <div className="ai-model-list-container">
            {/* Installed models */}
            {localModels.length > 0 && (
              <div className="ai-model-group">
                <div className="ai-model-group-title">
                  INSTALLED ON THIS MACHINE ({localModels.length})
                </div>
                {localModels.map((m) => {
                  const active = m === currentModel || m.split(':')[0] === currentModel
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`ai-model-item ${active ? 'active' : ''}`}
                      onClick={() => selectModel(m)}
                    >
                      <span className="ai-model-item-dot" />
                      <span className="ai-model-item-name" title={m}>
                        {m}
                      </span>
                      <span className="ai-model-installed-badge">Installed</span>
                      {active && <span className="ai-model-check">✓</span>}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Recommended Ollama Models */}
            <div className="ai-model-group">
              <div className="ai-model-group-title">
                {localModels.length > 0 ? 'RECOMMENDED MODELS' : 'POPULAR OLLAMA MODELS'}
              </div>
              {OLLAMA_PRESETS.map((m) => {
                const isInstalled = localModels.some((lm) => lm === m || lm.startsWith(`${m}:`))
                const active = m === currentModel || currentModel.startsWith(`${m}:`)
                return (
                  <button
                    key={m}
                    type="button"
                    className={`ai-model-item ${active ? 'active' : ''}`}
                    onClick={() => selectModel(m)}
                  >
                    <span className="ai-model-item-dot" />
                    <span className="ai-model-item-name" title={m}>
                      {m}
                    </span>
                    {isInstalled ? (
                      <span className="ai-model-installed-badge">Installed</span>
                    ) : (
                      <span className="ai-model-preset-badge">
                        {m === 'llama3.2' ? 'Default' : 'Preset'}
                      </span>
                    )}
                    {active && <span className="ai-model-check">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer: Custom model name input */}
          <div className="ai-model-dropdown-footer">
            {!showCustomInput ? (
              <button
                type="button"
                className="ai-model-custom-toggle"
                onClick={() => setShowCustomInput(true)}
              >
                + Enter custom model name...
              </button>
            ) : (
              <form className="ai-model-custom-form" onSubmit={applyCustom}>
                <input
                  type="text"
                  className="ai-model-custom-input"
                  placeholder="e.g. llama3.2:1b, codellama"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="ai-model-custom-submit">
                  Select
                </button>
                <button
                  type="button"
                  className="ai-model-custom-cancel"
                  onClick={() => setShowCustomInput(false)}
                  title="Cancel"
                >
                  ✕
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
