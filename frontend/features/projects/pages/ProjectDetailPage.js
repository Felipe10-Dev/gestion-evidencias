import { useRouter } from 'next/router'
import { useState } from 'react'

import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EmptyState } from '@/components/ui/EmptyState'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextInput } from '@/components/ui/FormField'
import { LoadingState } from '@/components/ui/LoadingState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { TeamsTable } from '@/features/projects/components/TeamsTable'
import { useToast } from '@/context/toast/ToastContext'
import { useAuth } from '@/context/auth/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { projectsService } from '@/services/api/projects.service'
import { teamsService } from '@/services/api/teams.service'

export function ProjectDetailPage({ projectId }) {
  const { user } = useAuth()
  const canManageTeams = user?.rol === 'admin'
  const router = useRouter()
  const { showToast } = useToast()
  const [teamPendingDelete, setTeamPendingDelete] = useState(null)
  const [deletingTeamId, setDeletingTeamId] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const [teamName, setTeamName] = useState('')

  const { data, isLoading, setData } = useAsyncData(async () => {
    if (!projectId) return { project: null, teams: [] }

    const [projectResponse, teamsResponse] = await Promise.all([
      projectsService.getById(projectId),
      teamsService.getByProject(projectId),
    ])

    return {
      project: projectResponse.data,
      teams: Array.isArray(teamsResponse.data) ? teamsResponse.data : [],
    }
  }, [projectId], {
    project: null,
    teams: [],
  })

  const teams = Array.isArray(data?.teams) ? data.teams.filter(Boolean) : []

  const handleRequestDelete = (team) => {
    setTeamPendingDelete(team)
  }

  const handleCloseDeleteModal = () => {
    if (deletingTeamId) return
    setTeamPendingDelete(null)
  }

  const handleDeleteTeam = async () => {
    if (!teamPendingDelete) return
    setDeletingTeamId(teamPendingDelete.id)

    try {
      await teamsService.remove(teamPendingDelete.id)

      const teamsResponse = await teamsService.getByProject(projectId)

      setData((prev) => ({
        ...prev,
        teams: Array.isArray(teamsResponse.data) ? teamsResponse.data : [],
      }))

      showToast({
        title: 'Equipo eliminado',
        description: `"${teamPendingDelete.nombre}" fue eliminado correctamente.`,
      })
      setTeamPendingDelete(null)
    } catch {
      showToast({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el equipo. Intenta de nuevo.',
        tone: 'error',
      })
    } finally {
      setDeletingTeamId(null)
    }
  }

  const handleEditTeam = (team) => {
    router.push(`/proyectos/equipos/${team.id}/editar?projectId=${projectId}`)
  }

  const handleOpenCreateModal = () => {
    setCreateErrorMessage('')
    setTeamName('')
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (isCreatingTeam) return
    setIsCreateModalOpen(false)
  }

  const handleCreateTeam = async (event) => {
    event.preventDefault()
    setCreateErrorMessage('')
    setIsCreatingTeam(true)

    try {
      await teamsService.create(teamName, projectId)

      const teamsResponse = await teamsService.getByProject(projectId)

      setData((prev) => ({
        ...prev,
        teams: Array.isArray(teamsResponse.data) ? teamsResponse.data : [],
      }))

      setIsCreateModalOpen(false)
      showToast({
        title: 'Equipo creado con éxito',
        description: `${teamName} quedó vinculado a ${data.project?.nombre || 'este proyecto'}.`,
      })
    } catch (error) {
      setCreateErrorMessage(error.response?.data?.error || 'Error al crear equipo')
    } finally {
      setIsCreatingTeam(false)
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (!data.project) {
    return (
      <EmptyState title="Proyecto no encontrado" />
    )
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/proyectos', label: 'Proyectos' },
          { label: data.project.nombre },
        ]}
      />

      <div className="panel-surface mb-6 rounded-2xl p-6 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Proyecto</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900">{data.project.nombre}</h1>
        {data.project.descripcion && (
          <p className="mt-3 max-w-3xl text-lg text-slate-600">{data.project.descripcion}</p>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">Equipos ({teams.length})</h2>
        {canManageTeams && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nuevo Equipo
          </button>
        )}
      </div>

      {teams.length === 0 ? (
        <EmptyState
          title="No hay equipos en este proyecto"
          action={canManageTeams ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="font-semibold text-blue-700 hover:underline"
            >
              Crear el primer equipo
            </button>
          ) : null}
        />
      ) : (
        <TeamsTable
          teams={teams}
          onEdit={canManageTeams ? handleEditTeam : undefined}
          onDelete={canManageTeams ? handleRequestDelete : undefined}
        />
      )}

      {canManageTeams && (
        <ConfirmModal
          isOpen={!!teamPendingDelete}
          isSubmitting={!!deletingTeamId}
          title="¿Eliminar equipo?"
          description={`El equipo "${teamPendingDelete?.nombre}" será eliminado permanentemente. Las evidencias asociadas quedarán sin equipo asignado.`}
          confirmLabel="Sí, eliminar"
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteTeam}
        />
      )}

      {canManageTeams && isCreateModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-6">
          <button
            type="button"
            aria-label="Cerrar formulario"
            onClick={handleCloseCreateModal}
            className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]"
          />

          <div className="panel-surface animated-in relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="text-2xl font-bold text-slate-900">Crear nuevo equipo</h3>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-blue-300 hover:text-blue-700"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6 18 18" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
                </svg>
              </button>
            </div>

            <FeedbackMessage message={createErrorMessage} />

            <form onSubmit={handleCreateTeam} className="space-y-6">
              <FormField label="Nombre del Equipo">
                <TextInput
                  type="text"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="Ej: Equipo A - Zona Norte"
                  required
                />
              </FormField>

              <button
                type="submit"
                disabled={isCreatingTeam}
                className="btn-primary w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingTeam ? 'Creando...' : 'Crear Equipo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}