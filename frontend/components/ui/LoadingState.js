export function LoadingState({ label = 'Cargando...' }) {
  return (
    <div className="panel-surface flex items-center justify-center gap-3 rounded-2xl px-6 py-10 text-slate-700">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}