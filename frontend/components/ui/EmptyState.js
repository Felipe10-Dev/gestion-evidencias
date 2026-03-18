export function EmptyState({ action, description, title }) {
  return (
    <div className="panel-surface rounded-2xl p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        0
      </div>
      <p className="mb-3 text-lg font-bold text-slate-800">{title}</p>
      {description && <p className="mb-4 text-sm text-slate-600">{description}</p>}
      {action}
    </div>
  )
}