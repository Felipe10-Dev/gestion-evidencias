import { useRouter } from 'next/router'
import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextAreaInput, TextInput } from '@/components/ui/FormField'
import { ActionCard } from '@/features/dashboard/components/ActionCard'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { useToast } from '@/context/toast/ToastContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { evidencesService } from '@/services/api/evidences.service'
import { projectsService } from '@/services/api/projects.service'
import { teamsService } from '@/services/api/teams.service'

export function DashboardPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isManageTeamsModalOpen, setIsManageTeamsModalOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const [formValues, setFormValues] = useState({ nombre: '', descripcion: '' })

  const { data: countsData } = useAsyncData(async () => {
    const [projectsResponse, teamsResponse] = await Promise.all([
      projectsService.getAll(),
      teamsService.getAll(),
    ])

    const projects = projectsResponse.data || []

    return {
      equipos: teamsResponse.data.length,
      proyectos: projects.length,
      projects,
    }
  }, [], { equipos: 0, proyectos: 0, projects: [] })

  const { data: imageCount, isLoading: isLoadingImages } = useAsyncData(
    () => evidencesService.getDriveImageCount().then((r) => r.data.totalImages),
    [],
    null
  )

  const handleOpenCreateModal = () => {
    setCreateErrorMessage('')
    setFormValues({ nombre: '', descripcion: '' })
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (isCreatingProject) return
    setIsCreateModalOpen(false)
  }

  const handleOpenManageTeamsModal = () => {
    setIsManageTeamsModalOpen(true)
  }

  const handleCloseManageTeamsModal = () => {
    setIsManageTeamsModalOpen(false)
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setCreateErrorMessage('')
    setIsCreatingProject(true)

    try {
      const response = await projectsService.create(formValues.nombre, formValues.descripcion)
      const createdProject = response.data

      setIsCreateModalOpen(false)
      showToast({
        title: 'Proyecto creado con exito',
        description: `${formValues.nombre} ya esta disponible en el listado.`,
      })

      if (createdProject?.id) {
        router.push(`/proyectos/${createdProject.id}`)
      }
    } catch (error) {
      setCreateErrorMessage(error.response?.data?.error || 'Error al crear proyecto')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleChange = (fieldName) => (event) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: event.target.value,
    }))
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricCard
          title="Proyectos"
          value={countsData.proyectos}
          tone="proyectos"
          href="/proyectos"
        />
        <MetricCard
          title="Equipos"
          value={countsData.equipos}
          tone="equipos"
          href="/proyectos"
        />
        <MetricCard
          title="Evidencias"
          value={isLoadingImages ? '...' : imageCount ?? 0}
          tone="evidencias"
          href="/evidencias"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ActionCard
          title="Crear Proyecto"
          description="Registra un nuevo frente de trabajo y su información base."
          onClick={handleOpenCreateModal}
        />
        <ActionCard
          title="Gestionar Equipos"
          description="Administra los equipos vinculados a cada proyecto activo."
          onClick={handleOpenManageTeamsModal}
        />
      </div>

      {isCreateModalOpen && (
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

      {isManageTeamsModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-6">
          <button
            type="button"
            aria-label="Cerrar gestión de equipos"
            onClick={handleCloseManageTeamsModal}
            className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]"
          />

          <div className="panel-surface animated-in relative z-10 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Gestionar equipos</h3>
                <p className="mt-1 text-sm text-slate-600">Selecciona un proyecto para administrar sus equipos.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseManageTeamsModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-blue-300 hover:text-blue-700"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6 18 18" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
                </svg>
              </button>
            </div>

            {countsData.projects.length === 0 ? (
              <EmptyState title="No hay proyectos disponibles" />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {countsData.projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => router.push(`/proyectos/${project.id}`)}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <p className="text-base font-bold text-slate-900">{project.nombre}</p>
                    <p className="mt-1 text-sm text-slate-600">{project.descripcion || 'Sin descripción'}</p>
                    <p className="mt-2 text-sm font-semibold text-blue-700">Administrar equipos →</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}