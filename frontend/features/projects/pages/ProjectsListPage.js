import { useState } from 'react'

import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextAreaInput, TextInput } from '@/components/ui/FormField'
import { LoadingState } from '@/components/ui/LoadingState'
import { useToast } from '@/context/toast/ToastContext'
import { ProjectCard } from '@/features/projects/components/ProjectCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/context/auth/AuthContext'
import { projectsService } from '@/services/api/projects.service'

export function ProjectsListPage() {
  const { user } = useAuth()
  const canManageProjects = user?.rol === 'admin'
  const { showToast } = useToast()
  const [errorMessage, setErrorMessage] = useState('')
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [formValues, setFormValues] = useState({ nombre: '', descripcion: '' })
  const [deletingProjectId, setDeletingProjectId] = useState('')
  const [projectPendingDelete, setProjectPendingDelete] = useState(null)
  const { data: projects, isLoading, setData: setProjects } = useAsyncData(async () => {
    const response = await projectsService.getAll()
    return response.data
  }, [], [])

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

  const handleCloseCreateModal = () => {
    if (isCreatingProject) return
    setIsCreateModalOpen(false)
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setCreateErrorMessage('')
    setIsCreatingProject(true)

    try {
      const response = await projectsService.create(formValues.nombre, formValues.descripcion)
      const createdProject = response.data

      setProjects((currentProjects) => [createdProject, ...currentProjects])
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
              onDelete={handleRequestDelete}
            />
          ))}
        </div>
      )}

      {canManageProjects && isCreateModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-6">
          <button
            type="button"
            aria-label="Cerrar formulario"
            onClick={handleCloseCreateModal}
            className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]"
          />

          <div className="panel-surface animated-in relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="text-2xl font-bold text-slate-900">Crear nuevo proyecto</h3>
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
          </div>
        </div>
      )}
    </>
  )
}