import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextInput } from '@/components/ui/FormField'
import { LoadingState } from '@/components/ui/LoadingState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/toast/ToastContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { subscribeToDataChanges } from '@/lib/appDataEvents'
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

function EditIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10a2.121 2.121 0 0 0-3-3L5 17v3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
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
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  )
}

function ReferenceModal({
  errorMessage,
  isOpen,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
  title,
  value,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <button
        type="button"
        aria-label="Cerrar formulario"
        onClick={isSubmitting ? undefined : onClose}
        className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]"
      />

      <div className="panel-surface animated-in relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6 18 18" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
            </svg>
          </button>
        </div>

        <FeedbackMessage message={errorMessage} />

        <form onSubmit={onSubmit} className="space-y-6">
          <FormField label="Nombre de la referencia">
            <TextInput
              id="reference-name"
              name="referenceName"
              type="text"
              value={value}
              onChange={onChange}
              placeholder="Ej: LG K40"
              required
              autoFocus
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : submitLabel}
          </button>
        </form>
      </div>
    </div>
  )
}

function getApiErrorMessage(error, fallback) {
  return error?.response?.data?.error?.message || error?.response?.data?.error || fallback
}

export function EvidencesPage() {
  const { showToast } = useToast()
  const [deletingFolderId, setDeletingFolderId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false)
  const [isReferenceEditModalOpen, setIsReferenceEditModalOpen] = useState(false)
  const [isSavingReference, setIsSavingReference] = useState(false)
  const [referenceErrorMessage, setReferenceErrorMessage] = useState('')
  const [referenceName, setReferenceName] = useState('')
  const [referenceTarget, setReferenceTarget] = useState(null)
  const [referenceEditingTarget, setReferenceEditingTarget] = useState(null)
  const [collapsedProjects, setCollapsedProjects] = useState({})
  const [collapsedTeams, setCollapsedTeams] = useState({})

  const { data: driveTree, isLoading, setData: setDriveTree, refetch } = useAsyncData(async () => {
    const response = await evidencesService.getDriveTree()
    return response.data
  }, [], { rootFolderId: null, projects: [] })

  useEffect(() => {
    const refreshTree = () => {
      refetch()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTree()
      }
    }

    window.addEventListener('focus', refreshTree)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const unsubscribe = subscribeToDataChanges(({ scope }) => {
      if (scope === 'all' || scope === 'projects' || scope === 'teams') {
        refreshTree()
      }
    })

    return () => {
      window.removeEventListener('focus', refreshTree)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      unsubscribe()
    }
  }, [])

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

        if (level === 'reference') {
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
                    referencias: (team.referencias || []).filter((reference) => reference.id !== folderId),
                  }
                }),
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

      if (level === 'reference') {
        showToast({
          title: 'Referencia eliminada',
          description: `"${pendingDelete.nombre}" se eliminó correctamente.`,
        })
      }
    } catch (error) {
      showToast({
        title: 'Error al eliminar',
        description: getApiErrorMessage(error, 'No se pudo eliminar la carpeta'),
        tone: 'error',
      })
    } finally {
      setDeletingFolderId(null)
    }
  }

  const handleOpenCreateReferenceModal = (projectId, team) => {
    if (!team?.appTeamId) {
      showToast({
        title: 'Equipo no vinculado',
        description: 'Este equipo no esta vinculado a la app (falta appTeamId).',
        tone: 'error',
      })
      return
    }

    setReferenceTarget({ projectId, team })
    setReferenceName('')
    setReferenceErrorMessage('')
    setIsReferenceModalOpen(true)
  }

  const handleCloseCreateReferenceModal = () => {
    if (isSavingReference) return
    setIsReferenceModalOpen(false)
    setReferenceTarget(null)
    setReferenceName('')
    setReferenceErrorMessage('')
  }

  const handleOpenEditReferenceModal = (projectId, teamId, reference) => {
    setReferenceEditingTarget({ projectId, teamId, reference })
    setReferenceName(reference.name || '')
    setReferenceErrorMessage('')
    setIsReferenceEditModalOpen(true)
  }

  const handleCloseEditReferenceModal = () => {
    if (isSavingReference) return
    setIsReferenceEditModalOpen(false)
    setReferenceEditingTarget(null)
    setReferenceName('')
    setReferenceErrorMessage('')
  }

  const handleCreateReference = async (event) => {
    event.preventDefault()

    const nombre = referenceName.trim()
    const projectId = referenceTarget?.projectId
    const team = referenceTarget?.team

    if (!projectId || !team?.id || !team?.appTeamId) {
      setReferenceErrorMessage('No se pudo identificar el equipo para crear la referencia.')
      return
    }

    if (!nombre) {
      setReferenceErrorMessage('Ingresa un nombre para la referencia.')
      return
    }

    try {
      setIsSavingReference(true)
      setReferenceErrorMessage('')
      const response = await evidencesService.createTeamSubfolder(team.appTeamId, nombre)
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

      handleCloseCreateReferenceModal()
      showToast({
        title: 'Referencia creada',
        description: `${newReference.name} fue creada correctamente.`,
      })
    } catch (error) {
      setReferenceErrorMessage(getApiErrorMessage(error, 'No se pudo crear la referencia'))
    } finally {
      setIsSavingReference(false)
    }
  }

  const handleEditReference = async (event) => {
    event.preventDefault()

    const nombre = referenceName.trim()
    const target = referenceEditingTarget

    if (!target?.reference?.id || !target.projectId || !target.teamId) {
      setReferenceErrorMessage('No se pudo identificar la referencia a editar.')
      return
    }

    if (!nombre) {
      setReferenceErrorMessage('Ingresa un nombre para la referencia.')
      return
    }

    try {
      setIsSavingReference(true)
      setReferenceErrorMessage('')
      const response = await evidencesService.renameFolder(target.reference.id, nombre)
      const renamedReference = response.data

      setDriveTree((prev) => ({
        ...prev,
        projects: prev.projects.map((project) => {
          if (project.id !== target.projectId) return project
          return {
            ...project,
            teams: project.teams.map((team) => {
              if (team.id !== target.teamId) return team
              return {
                ...team,
                referencias: (team.referencias || []).map((reference) => {
                  if (reference.id !== target.reference.id) return reference
                  return {
                    ...reference,
                    name: renamedReference.name,
                    driveUrl: renamedReference.driveUrl || reference.driveUrl,
                  }
                }),
              }
            }),
          }
        }),
      }))

      handleCloseEditReferenceModal()
      showToast({
        title: 'Referencia actualizada',
        description: `${renamedReference.name} fue actualizada correctamente.`,
      })
    } catch (error) {
      setReferenceErrorMessage(getApiErrorMessage(error, 'No se pudo editar la referencia'))
    } finally {
      setIsSavingReference(false)
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
                        type="button"
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
                        onClick={() => handleRequestDelete({ folderId: project.id, nombre: project.name, level: 'project', projectId: project.id })}
                        disabled={deletingFolderId === project.id}
                        tone="danger"
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </div>

                  {!isProjectCollapsed && (((project.teams || []).length === 0) ? (
                    <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
                      Este proyecto no tiene equipos creados en Drive.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3 border-l border-slate-200 pl-3">
                      {(project.teams || []).map((team) => {
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
                                  type="button"
                                  title={isTeamCollapsed ? 'Expandir equipo' : 'Contraer equipo'}
                                  onClick={() => toggleTeam(project.id, team.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                                >
                                  <ChevronIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isTeamCollapsed ? '-rotate-90' : 'rotate-90'}`} />
                                </button>

                                <button
                                  type="button"
                                  title="Crear referencia"
                                  onClick={() => handleOpenCreateReferenceModal(project.id, team)}
                                  disabled={isSavingReference || !team.appTeamId}
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
                                  onClick={() => handleRequestDelete({ folderId: team.id, nombre: team.name, level: 'team', projectId: project.id, teamId: team.id })}
                                  disabled={deletingFolderId === team.id}
                                  tone="danger"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </IconButton>
                              </div>
                            </div>

                            {!isTeamCollapsed && (((team.referencias || []).length === 0) ? (
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

                                      <div className="flex items-center gap-2">
                                        <IconButton
                                          title="Editar referencia"
                                          onClick={() => handleOpenEditReferenceModal(project.id, team.id, referencia)}
                                          disabled={isSavingReference}
                                        >
                                          <EditIcon className="h-3.5 w-3.5" />
                                        </IconButton>

                                        <a
                                          title="Abrir referencia en Drive"
                                          href={referencia.driveUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                                        >
                                          <LinkIcon className="h-3.5 w-3.5" />
                                        </a>

                                        <IconButton
                                          title="Eliminar referencia"
                                          onClick={() => handleRequestDelete({ folderId: referencia.id, nombre: referencia.name, level: 'reference', projectId: project.id, teamId: team.id })}
                                          disabled={deletingFolderId === referencia.id}
                                          tone="danger"
                                        >
                                          <TrashIcon className="h-3.5 w-3.5" />
                                        </IconButton>
                                      </div>
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

      <ReferenceModal
        isOpen={isReferenceModalOpen}
        isSubmitting={isSavingReference}
        errorMessage={referenceErrorMessage}
        onChange={(event) => setReferenceName(event.target.value)}
        onClose={handleCloseCreateReferenceModal}
        onSubmit={handleCreateReference}
        submitLabel="Crear referencia"
        title="Crear nueva referencia"
        value={referenceName}
      />

      <ReferenceModal
        isOpen={isReferenceEditModalOpen}
        isSubmitting={isSavingReference}
        errorMessage={referenceErrorMessage}
        onChange={(event) => setReferenceName(event.target.value)}
        onClose={handleCloseEditReferenceModal}
        onSubmit={handleEditReference}
        submitLabel="Guardar cambios"
        title="Editar referencia"
        value={referenceName}
      />
    </>
  )
}