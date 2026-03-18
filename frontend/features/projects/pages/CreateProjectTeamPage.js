import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { useToast } from '@/context/toast/ToastContext'
import { TeamForm } from '@/features/projects/components/TeamForm'
import { projectsService } from '@/services/api/projects.service'
import { teamsService } from '@/services/api/teams.service'

export function CreateProjectTeamPage({ projectId }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [project, setProject] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!projectId) return

    projectsService.getById(projectId)
      .then((response) => setProject(response.data))
      .catch(() => {})
  }, [projectId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!projectId) {
      setErrorMessage('No se detecto el proyecto. Recarga la pagina e intenta de nuevo.')
      return
    }

    setIsSubmitting(true)

    try {
      await teamsService.create(teamName, projectId)
      showToast({
        title: 'Equipo creado con éxito',
        description: `${teamName} quedó vinculado a ${project?.nombre || 'este proyecto'}.`,
      })
      router.push(`/proyectos/${projectId}`)
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Error al crear equipo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/proyectos', label: 'Proyectos' },
          { href: `/proyectos/${projectId}`, label: project?.nombre || '...' },
          { label: 'Nuevo Equipo' },
        ]}
      />

      <TeamForm
        errorMessage={errorMessage}
        goBackHref={`/proyectos/${projectId}`}
        isSubmitting={isSubmitting}
        onChange={(event) => setTeamName(event.target.value)}
        onSubmit={handleSubmit}
        teamName={teamName}
      />
    </>
  )
}