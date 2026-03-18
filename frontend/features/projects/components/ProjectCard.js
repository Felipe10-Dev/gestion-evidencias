import Link from 'next/link'

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10a2.121 2.121 0 0 0-3-3L5 17v3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  )
}

export function ProjectCard({ canManage = true, isDeleting = false, onDelete, project }) {
  return (
    <div className="panel-surface rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Proyecto</p>
        {canManage && (
          <div className="flex items-center gap-2">
            <Link
              href={`/proyectos/${project.id}/editar`}
              aria-label={`Editar ${project.nombre}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
            >
              <EditIcon />
            </Link>
            <button
              type="button"
              onClick={() => onDelete?.(project)}
              disabled={isDeleting}
              aria-label={`Eliminar ${project.nombre}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DeleteIcon />
            </button>
          </div>
        )}
      </div>

      <Link href={`/proyectos/${project.id}`} className="block cursor-pointer">
        <h2 className="mb-2 text-xl font-bold text-slate-900">{project.nombre}</h2>
        <p className="mb-4 text-slate-600">{project.descripcion}</p>
        <div className="mt-2 text-sm font-bold text-blue-700">Ver equipos →</div>
      </Link>
    </div>
  )
}