import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useState } from 'react'
import { useAsyncData } from '@/hooks/useAsyncData'
import { evidencesService } from '@/services/api/evidences.service'

function FolderIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function LinkIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
    </svg>
  )
}

function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  )
}

function ChevronIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
    </svg>
  )
}

function IconButton({ title, onClick, disabled, tone = 'neutral', children }) {
  const toneClass = tone === 'danger'
    ? 'border-slate-200 bg-white text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-sm hover:shadow-red-100'
    : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'

  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  )
}

export function EvidencesPage() {
  const [deletingFolderId, setDeletingFolderId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [creatingReferenceTeamId, setCreatingReferenceTeamId] = useState(null)
  const [collapsedProjects, setCollapsedProjects] = useState({})
  const [collapsedTeams, setCollapsedTeams] = useState({})

  const { data: driveTree, isLoading, setData: setDriveTree } = useAsyncData(async () => {
    const response = await evidencesService.getDriveTree()
    return response.data
  }, [], { rootFolderId: null, projects: [] })

  const handleRequestDelete = (payload) => {
    setPendingDelete(payload)
  }

  const handleCloseDeleteModal = () => {
    if (deletingFolderId) return
    setPendingDelete(null)
  }

  const handleDeleteFolder = async () => {
    if (!pendingDelete) return

    const { folderId, level, projectId, teamId, phaseKey } = pendingDelete

    try {
      setDeletingFolderId(folderId)
      await evidencesService.removeFolder(folderId)

      setDriveTree((prev) => {
        if (level === 'project') {
          return {
            ...prev,
            projects: prev.projects.filter((project) => project.id !== projectId),
          }
        }

        if (level === 'team') {
          return {
            ...prev,
            projects: prev.projects.map((project) => {
              if (project.id !== projectId) return project
              return {
                ...project,
                teams: project.teams.filter((team) => team.id !== teamId),
              }
            }),
          }
        }

        if (level === 'phase') {
          return {
            ...prev,
            projects: prev.projects.map((project) => {
              if (project.id !== projectId) return project
              return {
                ...project,
                teams: project.teams.map((team) => {
                  if (team.id !== teamId) return team
                  return {
                    ...team,
                    phases: {
                      ...team.phases,
                      [phaseKey]: null,
                    },
                  }
                }),
              }
            }),
          }
        }

        return prev
      })

      setPendingDelete(null)
    } catch (error) {
      const apiMessage = error?.response?.data?.error
      const message = apiMessage || 'No se pudo eliminar la carpeta'
      window.alert(message)
    } finally {
      setDeletingFolderId(null)
    }
  }

  const handleCreateReference = async (projectId, team) => {
    if (!team?.appTeamId) {
      window.alert('Este equipo no esta vinculado a la app (falta appTeamId).')
      return
    }

    const nombre = window.prompt('Nombre de la referencia (ej. LG K40):')
    if (!nombre || !nombre.trim()) return

    try {
      setCreatingReferenceTeamId(team.id)
      const response = await evidencesService.createTeamSubfolder(team.appTeamId, nombre.trim())
      const newReference = response.data

      setDriveTree((prev) => ({
        ...prev,
        projects: prev.projects.map((project) => {
          if (project.id !== projectId) return project
          return {
            ...project,
            teams: project.teams.map((item) => {
              if (item.id !== team.id) return item
              return {
                ...item,
                referencias: [...(item.referencias || []), newReference],
              }
            }),
          }
        }),
      }))
    } catch (error) {
      const apiMessage = error?.response?.data?.error
      const message = apiMessage || 'No se pudo crear la referencia'
      window.alert(message)
    } finally {
      setCreatingReferenceTeamId(null)
    }
  }

  const toggleProject = (projectId) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
  }

  const toggleTeam = (projectId, teamId) => {
    const key = `${projectId}:${teamId}`
    setCollapsedTeams((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const projects = driveTree?.projects || []

  const PROJECT_ICON_STYLE = 'border-blue-200 bg-blue-50 text-blue-600'

  return (
    <>
      <div className="space-y-4">
      {isLoading ? (
        <LoadingState />
      ) : projects.length === 0 ? (
        <EmptyState title="No hay carpetas de Drive disponibles" />
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const isProjectCollapsed = !!collapsedProjects[project.id]
            return (
            <section
              key={project.id}
              className="panel-surface rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`rounded-lg border p-2 ${PROJECT_ICON_STYLE}`}>
                    <FolderIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Proyecto</p>
                    <h3 className="truncate text-base font-bold text-slate-900">{project.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    title={isProjectCollapsed ? 'Expandir proyecto' : 'Contraer proyecto'}
                    onClick={() => toggleProject(project.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                  >
                    <ChevronIcon className={`h-4 w-4 transition-transform duration-200 ${isProjectCollapsed ? '-rotate-90' : 'rotate-90'}`} />
                  </button>
                  <a
                    title="Abrir proyecto en Drive"
                    href={project.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                  >
                    <LinkIcon />
                  </a>
                  <IconButton
                    title="Eliminar proyecto"
                    onClick={() =>
                      handleRequestDelete({
                        folderId: project.id,
                        nombre: project.name,
                        level: 'project',
                        projectId: project.id,
                      })
                    }
                    disabled={deletingFolderId === project.id}
                    tone="danger"
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </div>

              {!isProjectCollapsed && (project.teams.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
                  Este proyecto no tiene equipos creados en Drive.
                </p>
              ) : (
                <div className="mt-4 space-y-3 border-l border-slate-200 pl-3">
                  {project.teams.map((team) => {
                    const teamCollapseKey = `${project.id}:${team.id}`
                    const isTeamCollapsed = !!collapsedTeams[teamCollapseKey]
                    return (
                    <article
                      key={team.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500">
                            <FolderIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Equipo</p>
                            <h4 className="truncate text-sm font-semibold text-slate-900">{team.name}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            title={isTeamCollapsed ? 'Expandir equipo' : 'Contraer equipo'}
                            onClick={() => toggleTeam(project.id, team.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                          >
                            <ChevronIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isTeamCollapsed ? '-rotate-90' : 'rotate-90'}`} />
                          </button>
                          <button
                            title="Crear referencia"
                            onClick={() => handleCreateReference(project.id, team)}
                            disabled={creatingReferenceTeamId === team.id || !team.appTeamId}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="text-base leading-none">+</span>
                          </button>
                          <a
                            title="Abrir equipo en Drive"
                            href={team.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                          </a>
                          <IconButton
                            title="Eliminar equipo"
                            onClick={() =>
                              handleRequestDelete({
                                folderId: team.id,
                                nombre: team.name,
                                level: 'team',
                                projectId: project.id,
                                teamId: team.id,
                              })
                            }
                            disabled={deletingFolderId === team.id}
                            tone="danger"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </IconButton>
                        </div>
                      </div>

                      {!isTeamCollapsed && ((team.referencias || []).length === 0 ? (
                        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">
                          Sin referencias. Crea una referencia para organizar Antes/Durante/Despues.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {(team.referencias || []).map((referencia) => (
                            <div key={referencia.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                                  <FolderIcon className="h-3 w-3" />
                                  {referencia.name}
                                </div>
                                <a
                                  title="Abrir referencia en Drive"
                                  href={referencia.driveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                                >
                                  <LinkIcon className="h-3.5 w-3.5" />
                                </a>
                              </div>

                              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                {['antes', 'durante', 'despues'].map((phaseKey) => {
                                  const phase = referencia.phases?.[phaseKey]
                                  const phaseTitle = phaseKey.charAt(0).toUpperCase() + phaseKey.slice(1)
                                  return (
                                    <div
                                      key={`${referencia.id}-${phaseKey}`}
                                      className="flex min-h-[72px] flex-col rounded-md border border-slate-200 bg-slate-50 p-2"
                                    >
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{phaseTitle}</p>
                                      {phase ? (
                                        <div className="mt-auto flex justify-end">
                                          <a
                                            title={`Abrir ${phaseTitle} en Drive`}
                                            href={phase.driveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                                          >
                                            <LinkIcon className="h-3 w-3" />
                                          </a>
                                        </div>
                                      ) : (
                                        <p className="mt-1 text-[11px] text-slate-400">Sin carpeta</p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </article>
                    )
                  })}
                </div>
              ))}
            </section>
            )
          })}
        </div>
      )}
      </div>

      <ConfirmModal
        isOpen={!!pendingDelete}
        isSubmitting={!!deletingFolderId}
        title="¿Eliminar carpeta?"
        description={`Se eliminará "${pendingDelete?.nombre}" en Drive y también en la app. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteFolder}
      />
    </>
  )
}