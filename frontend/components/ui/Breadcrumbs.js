import Link from 'next/link'

export function Breadcrumbs({ items }) {
  return (
    <div className="panel-surface mb-5 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center">
          {index > 0 && <span className="mx-2 text-slate-400">›</span>}
          {item.href ? (
            <Link href={item.href} className="font-semibold text-blue-700 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-700">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}