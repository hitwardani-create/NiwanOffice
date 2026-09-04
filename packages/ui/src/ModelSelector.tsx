import React, { useEffect, useRef, useState } from 'react'
import type { AiSettings } from '@genoffice/ai-provider'

export interface ModelSelectorProps {
  settings?: AiSettings | null
  onModelChange?: (model: string) => void
  className?: string
}

const DEFAULT_PRESETS = [
  'llama3.2',
  'qwen2.5-coder',
  'deepseek-r1',
  'mistral',
  'qwen2.5',
  'llama3.1',
  'gemma2',
  'phi4',
]

export function ModelSelector({ settings, onModelChange, className }: ModelSelectorProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [localModels, setLocalModels] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const provider = settings?.provider || 'ollama'
  const config = settings?.providers?.[provider]
  const currentModel = config?.model || 'llama3.2'
  const baseUrl = config?.baseUrl || 'http://localhost:11434/v1'

  // Probes Ollama / local runtime to list pre-installed models
  const detectLocalModels = async (autoSelect = false) => {
    setDetecting(true)
    setStatusMessage('Checking local models...')
    try {
      let models: string[] = []
      const win = window as any
      const listFn =
        win.desktop?.listLocalModels ||
        win.desktopApi?.listLocalModels ||
        win.slidesApi?.listLocalModels ||
        win.aiOffice?.listLocalModels

      if (typeof listFn === 'function') {
        models = await listFn(baseUrl)
      } else {
        try {
          const res = await fetch(`${baseUrl.replace(/\/v1$/, '')}/api/tags`).catch(() => null)
          if (res && res.ok) {
            const data = (await res.json()) as { models?: Array<{ name?: string; model?: string }> }
            if (Array.isArray(data.models)) {
              models = data.models.map((m: any) => m.name || m.model || '').filter(Boolean)
            }
          }
        } catch {
          /* fallback */
        }
      }

      if (models.length > 0) {
        setLocalModels(models)
        setStatusMessage(`${models.length} local model(s) installed`)
        if (autoSelect || !currentModel || !models.includes(currentModel)) {
          if (models[0]) onModelChange?.(models[0])
        }
      } else {
        setStatusMessage('No models found in Ollama yet')
      }
    } catch {
      setStatusMessage('Ollama server not reachable')
    } finally {
      setDetecting(false)
    }
  }

  // Initial detection when provider is ollama or custom
  useEffect(() => {
    if (provider === 'ollama' || provider === 'custom') {
      void detectLocalModels(false)
    }
  }, [provider, baseUrl])

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
    onModelChange?.(model)
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

  const isConnected = localModels.length > 0

  return (
    <div ref={wrapRef} className={`ai-model-selector ${className ?? ''}`}>
      <button
        type="button"
        className={`ai-model-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        title={`Active model: ${currentModel} (${provider})`}
        aria-label="Select AI model"
        aria-expanded={open}
      >
        <span
          className={`ai-model-status-dot ${detecting ? 'detecting' : isConnected ? 'online' : 'preset'}`}
          aria-hidden="true"
        />
        <span className="ai-model-label" title={currentModel}>
          {currentModel}
        </span>
        <svg className="ai-model-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="ai-model-dropdown" role="dialog" aria-label="Available models">
          <div className="ai-model-dropdown-header">
            <div className="ai-model-dropdown-title">
              <span className="ai-model-provider-badge">{provider.toUpperCase()}</span>
              <span>Model</span>
            </div>
            <button
              type="button"
              className="ai-model-auto-btn"
              onClick={() => void detectLocalModels(true)}
              disabled={detecting}
              title="Detect installed models from local server and select the first available"
            >
              {detecting ? 'Scanning...' : '⚡ Auto-Select'}
            </button>
          </div>

          {statusMessage && (
            <div className={`ai-model-status-bar ${isConnected ? 'ok' : 'info'}`}>
              {statusMessage}
            </div>
          )}

          <div className="ai-model-list-container">
            {localModels.length > 0 && (
              <div className="ai-model-group">
                <div className="ai-model-group-title">INSTALLED LOCALLY</div>
                {localModels.map((m) => {
                  const active = m === currentModel
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`ai-model-item ${active ? 'active' : ''}`}
                      onClick={() => selectModel(m)}
                    >
                      <span className="ai-model-item-name">{m}</span>
                      <span className="ai-model-installed-badge">Installed</span>
                      {active && <span className="ai-model-check">✓</span>}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="ai-model-group">
              <div className="ai-model-group-title">
                {localModels.length > 0 ? 'AVAILABLE PRESETS' : 'PRESET MODELS'}
              </div>
              {DEFAULT_PRESETS.map((m) => {
                const active = m === currentModel
                const isInstalled = localModels.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    className={`ai-model-item ${active ? 'active' : ''}`}
                    onClick={() => selectModel(m)}
                  >
                    <span className="ai-model-item-name">{m}</span>
                    {isInstalled ? (
                      <span className="ai-model-installed-badge">Installed</span>
                    ) : (
                      <span className="ai-model-preset-badge">Preset</span>
                    )}
                    {active && <span className="ai-model-check">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

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
                  placeholder="e.g. llama3.2:1b"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="ai-model-custom-submit">
                  Use
                </button>
                <button
                  type="button"
                  className="ai-model-custom-cancel"
                  onClick={() => setShowCustomInput(false)}
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
