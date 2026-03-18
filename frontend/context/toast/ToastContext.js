import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

function ToastIcon({ tone }) {
  if (tone === 'error') {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm shadow-red-100/80">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16h.01" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/80">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 12 3 3 6-6" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    </div>
  )
}

function ToastItem({ onDismiss, toast }) {
  const styles = {
    success: {
      label: 'Listo',
      labelClassName: 'text-blue-600',
      closeClassName: 'text-slate-400 hover:text-blue-700',
      glowClassName: 'bg-[radial-gradient(circle_at_right_top,_rgba(27,99,231,0.16),_transparent_68%)]',
    },
    error: {
      label: 'Atención',
      labelClassName: 'text-red-500',
      closeClassName: 'text-slate-400 hover:text-red-600',
      glowClassName: 'bg-[radial-gradient(circle_at_right_top,_rgba(239,68,68,0.14),_transparent_68%)]',
    },
  }

  const tone = styles[toast.tone] || styles.success

  return (
    <div className="panel-surface animated-in pointer-events-auto relative w-full overflow-hidden rounded-[1.45rem] border border-slate-200/90 bg-white p-4 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]">
      <div className={`absolute inset-0 ${tone.glowClassName}`} />

      <div className="relative flex gap-3">
        <ToastIcon tone={toast.tone} />

        <div className="min-w-0 flex-1 pr-6">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone.labelClassName}`}>
            {tone.label}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">{toast.title}</p>
          {toast.description ? <p className="mt-1 text-sm leading-5 text-slate-600">{toast.description}</p> : null}
        </div>

        <button
          type="button"
          aria-label="Cerrar notificación"
          onClick={() => onDismiss(toast.id)}
          className={`absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${tone.closeClassName}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6 18 18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((toastId) => {
    setToasts((currentToasts) => currentToasts.filter(({ id }) => id !== toastId))
  }, [])

  const showToast = useCallback(({ description = '', duration = 3600, title, tone = 'success' }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`

    setToasts((currentToasts) => [...currentToasts, { description, id, title, tone }])

    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
    }, duration)
  }, [])

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }

  return context
}