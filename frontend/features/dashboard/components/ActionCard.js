import Link from 'next/link'

export function ActionCard({ description, href, onClick, title }) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="panel-surface group cursor-pointer rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-700 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
              →
            </span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <Link href={href}>
      <div className="panel-surface group cursor-pointer rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-700 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}