import { useEffect } from 'react'

export function ModalDialog({ children, isOpen, maxWidth = 'max-w-2xl', onClose, title }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const currentOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = currentOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-6">
      <button
        type="button"
        aria-label="Cerrar formulario"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]"
      />

      <div className={`panel-surface animated-in relative z-10 w-full ${maxWidth} rounded-2xl border border-slate-200 bg-white p-6 md:p-7`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-blue-300 hover:text-blue-700"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6 18 18" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}