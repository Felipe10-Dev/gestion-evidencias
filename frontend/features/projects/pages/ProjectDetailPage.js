import { useState } from 'react'

import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EmptyState } from '@/components/ui/EmptyState'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextInput } from '@/components/ui/FormField'
import { LoadingState } from '@/components/ui/LoadingState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { ModalDialog } from '@/components/ui/ModalDialog'
import { TeamsTable } from '@/features/projects/components/TeamsTable'
import { useToast } from '@/context/toast/ToastContext'
import { useAuth } from '@/context/auth/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { projectsService } from '@/services/api/projects.service'
import { teamsService } from '@/services/api/teams.service'

function toDisplayText(value, fallback = '') {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object') {
    if ('nombre' in value) {
      return toDisplayText(value.nombre, fallback)
    }

    if ('descripcion' in value) {
      return toDisplayText(value.descripcion, fallback)
    }

    if ('message' in value) {
      return toDisplayText(value.message, fallback)
    }
  }

  return fallback
}

export function ProjectDetailPage({ projectId }) {
  const { user } = useAuth()
  const canManageTeams = user?.rol === 'admin'
  const { showToast } = useToast()
  const [teamPendingDelete, setTeamPendingDelete] = useState(null)
  const [deletingTeamId, setDeletingTeamId] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [teamBeingEdited, setTeamBeingEdited] = useState(null)
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false)
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const [editErrorMessage, setEditErrorMessage] = useState('')
  const [teamName, setTeamName] = useState('')
  const [editTeamName, setEditTeamName] = useState('')

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
  const projectName = toDisplayText(data?.project?.nombre, 'Proyecto')
  const projectDescription = toDisplayText(data?.project?.descripcion)

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
        description: `"${toDisplayText(teamPendingDelete?.nombre, 'Equipo')}" fue eliminado correctamente.`,
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
    setEditErrorMessage('')
    setTeamBeingEdited(team)
    setEditTeamName(toDisplayText(team?.nombre))
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

  const handleCloseEditModal = () => {
    if (isUpdatingTeam) return
    setTeamBeingEdited(null)
    setEditErrorMessage('')
    setEditTeamName('')
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
        description: `${toDisplayText(teamName, 'El equipo')} quedó vinculado a ${projectName || 'este proyecto'}.`,
      })
    } catch (error) {
      setCreateErrorMessage(toDisplayText(error.response?.data?.error, 'Error al crear equipo'))
    } finally {
      setIsCreatingTeam(false)
    }
  }

  const handleUpdateTeam = async (event) => {
    event.preventDefault()

    if (!teamBeingEdited) {
      return
    }

    const nextTeamName = editTeamName.trim()

    if (!nextTeamName) {
      setEditErrorMessage('El nombre del equipo es requerido.')
      return
    }

    setEditErrorMessage('')
    setIsUpdatingTeam(true)

    try {
      await teamsService.update(teamBeingEdited.id, nextTeamName)

      setData((prev) => ({
        ...prev,
        teams: prev.teams.map((team) => (
          team.id === teamBeingEdited.id ? { ...team, nombre: nextTeamName } : team
        )),
      }))

      showToast({
        title: 'Equipo actualizado',
        description: `Los cambios de "${nextTeamName}" se guardaron correctamente.`,
      })
      handleCloseEditModal()
    } catch {
      setEditErrorMessage('Ocurrió un error al actualizar el equipo. Intenta de nuevo.')
    } finally {
      setIsUpdatingTeam(false)
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
          { label: projectName },
        ]}
      />

      <div className="panel-surface mb-6 rounded-2xl p-6 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Proyecto</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900">{projectName}</h1>
        {projectDescription && (
          <p className="mt-3 max-w-3xl text-lg text-slate-600">{projectDescription}</p>
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
          description={`El equipo "${toDisplayText(teamPendingDelete?.nombre, 'Equipo')}" será eliminado permanentemente. Las evidencias asociadas quedarán sin equipo asignado.`}
          confirmLabel="Sí, eliminar"
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteTeam}
        />
      )}

      <ModalDialog
        isOpen={canManageTeams && isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Crear nuevo equipo"
      >
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
      </ModalDialog>

      <ModalDialog
        isOpen={canManageTeams && Boolean(teamBeingEdited)}
        onClose={handleCloseEditModal}
        title="Editar equipo"
      >
        <FeedbackMessage message={editErrorMessage} />

        <form onSubmit={handleUpdateTeam} className="space-y-6">
          <FormField label="Nombre del Equipo">
            <TextInput
              type="text"
              value={editTeamName}
              onChange={(event) => setEditTeamName(event.target.value)}
              placeholder="Ej: Equipo A - Zona Norte"
              required
            />
          </FormField>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isUpdatingTeam}
              className="btn-primary px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingTeam ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={handleCloseEditModal}
              disabled={isUpdatingTeam}
              className="btn-soft px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </ModalDialog>
    </>
  )
}