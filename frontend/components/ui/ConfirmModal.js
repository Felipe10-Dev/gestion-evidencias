import { useEffect } from 'react'

function WarningIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/80">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    </div>
  )
}

export function ConfirmModal({
  confirmLabel = 'Confirmar',
  description,
  isOpen,
  isSubmitting = false,
  onClose,
  onConfirm,
  title,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const currentOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = currentOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={isSubmitting ? undefined : onClose}
        className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]"
      />

      <div className="panel-surface animated-in relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white p-7 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(27,99,231,0.16),_transparent_72%)]" />

        <div className="relative">
          <WarningIcon />

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Confirmación</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{title}</h3>
          {description ? <p className="mt-3 text-[15px] leading-6 text-slate-600">{description}</p> : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-soft px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Eliminando...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}