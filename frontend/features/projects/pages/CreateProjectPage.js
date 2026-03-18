import { useRouter } from 'next/router'
import { useState } from 'react'

import { useToast } from '@/context/toast/ToastContext'
import { ProjectForm } from '@/features/projects/components/ProjectForm'
import { projectsService } from '@/services/api/projects.service'

export function CreateProjectPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [formValues, setFormValues] = useState({ nombre: '', descripcion: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      await projectsService.create(formValues.nombre, formValues.descripcion)
      showToast({
        title: 'Proyecto creado con éxito',
        description: `${formValues.nombre} ya está disponible en el listado.`,
      })
      router.push('/proyectos')
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Error al crear proyecto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProjectForm
      formValues={formValues}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onChange={handleChange}
      onCancel={() => router.push('/proyectos')}
      onSubmit={handleSubmit}
      submitLabel="Crear Proyecto"
      submittingLabel="Creando..."
    />
  )
}