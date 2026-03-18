import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { useToast } from '@/context/toast/ToastContext'
import { TeamForm } from '@/features/projects/components/TeamForm'
import { projectsService } from '@/services/api/projects.service'
import { teamsService } from '@/services/api/teams.service'

export function EditTeamPage({ teamId, projectId }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [project, setProject] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!teamId || !projectId) return

    Promise.all([
      teamsService.getById(teamId),
      projectsService.getById(projectId),
    ])
      .then(([teamRes, projectRes]) => {
        setTeamName(teamRes.data.nombre)
        setProject(projectRes.data)
      })
      .catch(() => setErrorMessage('No se pudo cargar el equipo.'))
      .finally(() => setIsLoading(false))
  }, [teamId, projectId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!teamName.trim()) {
      setErrorMessage('El nombre del equipo es requerido.')
      return
    }

    setIsSubmitting(true)

    try {
      await teamsService.update(teamId, teamName.trim())
      showToast({
        title: 'Equipo actualizado',
        description: `Los cambios de "${teamName.trim()}" se guardaron correctamente.`,
      })
      router.push(`/proyectos/${projectId}`)
    } catch {
      setErrorMessage('Ocurrió un error al actualizar el equipo. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return null
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/proyectos', label: 'Proyectos' },
          { href: `/proyectos/${projectId}`, label: project?.nombre ?? 'Proyecto' },
          { label: 'Editar Equipo' },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Editar Equipo</h1>
        {project && (
          <p className="mt-1 text-sm text-slate-500">
            Proyecto: <span className="font-semibold">{project.nombre}</span>
          </p>
        )}
      </div>

      <TeamForm
        errorMessage={errorMessage}
        goBackHref={`/proyectos/${projectId}`}
        isSubmitting={isSubmitting}
        onChange={(e) => setTeamName(e.target.value)}
        onSubmit={handleSubmit}
        submitLabel="Guardar Cambios"
        teamName={teamName}
      />
    </>
  )
}
