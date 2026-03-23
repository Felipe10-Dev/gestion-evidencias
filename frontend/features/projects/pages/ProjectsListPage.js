import { useEffect, useState } from 'react'

import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextAreaInput, TextInput } from '@/components/ui/FormField'
import { LoadingState } from '@/components/ui/LoadingState'
import { ModalDialog } from '@/components/ui/ModalDialog'
import { useToast } from '@/context/toast/ToastContext'
import { ProjectCard } from '@/features/projects/components/ProjectCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/context/auth/AuthContext'
import { notifyDataChanged, subscribeToDataChanges } from '@/lib/appDataEvents'
import { projectsService } from '@/services/api/projects.service'

function normalizeProjectsResponse(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
}

export function ProjectsListPage() {
  const { user } = useAuth()
  const canManageProjects = user?.rol === 'admin'
  const { showToast } = useToast()
  const [errorMessage, setErrorMessage] = useState('')
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [projectBeingEdited, setProjectBeingEdited] = useState(null)
  const [editErrorMessage, setEditErrorMessage] = useState('')
  const [isUpdatingProject, setIsUpdatingProject] = useState(false)
  const [formValues, setFormValues] = useState({ nombre: '', descripcion: '' })
  const [editFormValues, setEditFormValues] = useState({ nombre: '', descripcion: '' })
  const [deletingProjectId, setDeletingProjectId] = useState('')
  const [projectPendingDelete, setProjectPendingDelete] = useState(null)
  const { data: projects, isLoading, setData: setProjects, refetch } = useAsyncData(async () => {
    const response = await projectsService.getAll()
    return normalizeProjectsResponse(response.data)
  }, [], [])

  useEffect(() => {
    const refreshProjectsData = () => {
      refetch()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshProjectsData()
      }
    }

    const intervalId = window.setInterval(refreshProjectsData, 15000)
    window.addEventListener('focus', refreshProjectsData)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const unsubscribe = subscribeToDataChanges(({ scope }) => {
      if (scope === 'all' || scope === 'projects' || scope === 'teams') {
        refreshProjectsData()
      }
    })

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshProjectsData)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      unsubscribe()
    }
  }, [refetch])

  const refreshProjects = async () => {
    const response = await projectsService.getAll()
    const nextProjects = normalizeProjectsResponse(response.data)
    setProjects(nextProjects)
    return nextProjects
  }

  const handleChange = (fieldName) => (event) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: event.target.value,
    }))
  }

  const handleOpenCreateModal = () => {
    setCreateErrorMessage('')
    setFormValues({ nombre: '', descripcion: '' })
    setIsCreateModalOpen(true)
  }

  const handleOpenEditModal = (project) => {
    setEditErrorMessage('')
    setProjectBeingEdited(project)
    setEditFormValues({
      nombre: project?.nombre || '',
      descripcion: project?.descripcion || '',
    })
  }

  const handleCloseCreateModal = () => {
    if (isCreatingProject) return
    setIsCreateModalOpen(false)
  }

  const handleCloseEditModal = () => {
    if (isUpdatingProject) return
    setProjectBeingEdited(null)
    setEditErrorMessage('')
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setCreateErrorMessage('')
    setIsCreatingProject(true)

    try {
      await projectsService.create(formValues.nombre, formValues.descripcion)
      await refreshProjects()
      notifyDataChanged('projects')
      setIsCreateModalOpen(false)
      showToast({
        title: 'Proyecto creado con éxito',
        description: `${formValues.nombre} ya está disponible en el listado.`,
      })
    } catch (error) {
      setCreateErrorMessage(error.response?.data?.error || 'Error al crear proyecto')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleEditChange = (fieldName) => (event) => {
    setEditFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: event.target.value,
    }))
  }

  const handleUpdateProject = async (event) => {
    event.preventDefault()

    if (!projectBeingEdited) {
      return
    }

    setEditErrorMessage('')
    setIsUpdatingProject(true)

    try {
      await projectsService.update(projectBeingEdited.id, editFormValues.nombre, editFormValues.descripcion)
      await refreshProjects()
      notifyDataChanged('projects')

      showToast({
        title: 'Proyecto actualizado',
        description: `Los cambios de ${editFormValues.nombre} se guardaron correctamente.`,
      })
      handleCloseEditModal()
    } catch (error) {
      setEditErrorMessage(error.response?.data?.error || 'Error al actualizar proyecto')
    } finally {
      setIsUpdatingProject(false)
    }
  }

  const handleRequestDelete = (project) => {
    setProjectPendingDelete(project)
  }

  const handleCloseDeleteModal = () => {
    if (deletingProjectId) {
      return
    }

    setProjectPendingDelete(null)
  }

  const handleDeleteProject = async () => {
    if (!projectPendingDelete) {
      return
    }

    setErrorMessage('')
    setDeletingProjectId(projectPendingDelete.id)

    try {
      await projectsService.remove(projectPendingDelete.id)
      setProjects((currentProjects) => currentProjects.filter(({ id }) => id !== projectPendingDelete.id))
      notifyDataChanged('projects')
      showToast({
        title: 'Proyecto eliminado',
        description: `${projectPendingDelete.nombre} se eliminó correctamente.`,
      })
      setProjectPendingDelete(null)
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'No se pudo eliminar el proyecto')
    } finally {
      setDeletingProjectId('')
    }
  }

  return (
    <>
      <FeedbackMessage message={errorMessage} />
      <ConfirmModal
        isOpen={Boolean(projectPendingDelete)}
        isSubmitting={deletingProjectId === projectPendingDelete?.id}
        title="¿Deseas eliminar este proyecto?"
        description={projectPendingDelete ? `Se eliminará ${projectPendingDelete.nombre} y sus equipos asociados. Esta acción no se puede deshacer.` : ''}
        confirmLabel="Sí, eliminar"
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteProject}
      />

      {canManageProjects && (
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nuevo Proyecto
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingState />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No hay proyectos creados"
          action={canManageProjects ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="font-semibold text-blue-700 hover:underline"
            >
              Crear el primer proyecto
            </button>
          ) : null}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              canManage={canManageProjects}
              isDeleting={deletingProjectId === project.id}
              onEdit={handleOpenEditModal}
              onDelete={handleRequestDelete}
            />
          ))}
        </div>
      )}

      <ModalDialog
        isOpen={canManageProjects && isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Crear nuevo proyecto"
      >
        <FeedbackMessage message={createErrorMessage} />

        <form onSubmit={handleCreateProject} className="space-y-6">
          <FormField label="Nombre del Proyecto">
            <TextInput
              type="text"
              value={formValues.nombre}
              onChange={handleChange('nombre')}
              placeholder="Ej: Reparación de línea de teléfono"
              required
            />
          </FormField>

          <FormField label="Descripción">
            <TextAreaInput
              value={formValues.descripcion}
              onChange={handleChange('descripcion')}
              placeholder="Descripción detallada del proyecto"
              rows="4"
            />
          </FormField>

          <button
            type="submit"
            disabled={isCreatingProject}
            className="btn-primary w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingProject ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </form>
      </ModalDialog>

      <ModalDialog
        isOpen={canManageProjects && Boolean(projectBeingEdited)}
        onClose={handleCloseEditModal}
        title="Editar proyecto"
      >
        <FeedbackMessage message={editErrorMessage} />

        <form onSubmit={handleUpdateProject} className="space-y-6">
          <FormField label="Nombre del Proyecto">
            <TextInput
              type="text"
              value={editFormValues.nombre}
              onChange={handleEditChange('nombre')}
              placeholder="Ej: Reparación de línea de teléfono"
              required
            />
          </FormField>

          <FormField label="Descripción">
            <TextAreaInput
              value={editFormValues.descripcion}
              onChange={handleEditChange('descripcion')}
              placeholder="Descripción detallada del proyecto"
              rows="4"
            />
          </FormField>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isUpdatingProject}
              className="btn-primary px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingProject ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={handleCloseEditModal}
              disabled={isUpdatingProject}
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