import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { LoadingState } from '@/components/ui/LoadingState'
import { useToast } from '@/context/toast/ToastContext'
import { ProjectForm } from '@/features/projects/components/ProjectForm'
import { projectsService } from '@/services/api/projects.service'

export function EditProjectPage({ projectId }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [formValues, setFormValues] = useState({ nombre: '', descripcion: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!projectId) {
      return
    }

    let isMounted = true

    const loadProject = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await projectsService.getById(projectId)

        if (!isMounted) {
          return
        }

        setFormValues({
          nombre: response.data.nombre || '',
          descripcion: response.data.descripcion || '',
        })
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.error || 'No se pudo cargar el proyecto')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProject()

    return () => {
      isMounted = false
    }
  }, [projectId])

  const handleChange = (fieldName) => (event) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await projectsService.update(projectId, formValues.nombre, formValues.descripcion)
      showToast({
        title: 'Proyecto actualizado',
        description: `Los cambios de ${formValues.nombre} se guardaron correctamente.`,
      })
      router.push('/proyectos')
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Error al actualizar proyecto')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingState label="Cargando proyecto..." />
  }

  return (
    <ProjectForm
      formValues={formValues}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onChange={handleChange}
      onCancel={() => router.push('/proyectos')}
      onSubmit={handleSubmit}
      submitLabel="Guardar Cambios"
      submittingLabel="Guardando..."
    />
  )
}