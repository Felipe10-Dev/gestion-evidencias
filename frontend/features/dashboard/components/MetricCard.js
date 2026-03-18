import Link from 'next/link'

const toneStyles = {
  evidencias: 'border-blue-100 bg-blue-50/70',
  equipos: 'border-blue-200 bg-blue-100/60',
  proyectos: 'border-blue-200 bg-blue-50',
}

const valueStyles = {
  evidencias: 'text-blue-800',
  equipos: 'text-blue-700',
  proyectos: 'text-blue-700',
}

export function MetricCard({ href, title, tone = 'proyectos', value }) {
  return (
    <Link href={href} className="block">
      <div className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneStyles[tone] || toneStyles.proyectos}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Indicador</p>
        <h3 className="mt-2 text-lg font-bold text-slate-800">{title}</h3>
        <p className={`mt-2 text-4xl font-extrabold ${valueStyles[tone] || valueStyles.proyectos}`}>
          {value}
        </p>
      </div>
    </Link>
  )
}