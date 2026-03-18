import Link from 'next/link'

function toDisplayText(value, fallback = '') {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object') {
    if ('label' in value) {
      return toDisplayText(value.label, fallback)
    }

    if ('nombre' in value) {
      return toDisplayText(value.nombre, fallback)
    }
  }

  return fallback
}

export function Breadcrumbs({ items }) {
  return (
    <div className="panel-surface mb-5 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-sm text-slate-500">
      {items.map((item, index) => {
        const label = toDisplayText(item.label, '...')

        return (
        <span key={`${label}-${index}`} className="flex items-center">
          {index > 0 && <span className="mx-2 text-slate-400">›</span>}
          {item.href ? (
            <Link href={item.href} className="font-semibold text-blue-700 hover:underline">
              {label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-700">{label}</span>
          )}
        </span>
        )
      })}
    </div>
  )
}