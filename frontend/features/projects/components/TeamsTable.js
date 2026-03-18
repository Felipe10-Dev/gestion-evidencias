export function TeamsTable({ teams, onEdit, onDelete }) {
  const canManage = Boolean(onEdit || onDelete)

  return (
    <div className="panel-surface overflow-x-auto rounded-2xl">
      <table className="min-w-full">
        <thead className="bg-slate-100/80">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Nombre</th>
            {canManage && (
              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id} className="border-t border-slate-100 hover:bg-white/70">
              <td className="px-6 py-4 font-semibold text-slate-800">{team.nombre}</td>
              {canManage && (
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit?.(team)}
                      title="Editar equipo"
                      className="group rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10a2.121 2.121 0 0 0-3-3L5 17v3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onDelete?.(team)}
                      title="Eliminar equipo"
                      className="group rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                      </svg>
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}