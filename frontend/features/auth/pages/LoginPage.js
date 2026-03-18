import { useRouter } from 'next/router'
import { useState } from 'react'

import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextInput } from '@/components/ui/FormField'
import { useAuth } from '@/context/auth/AuthContext'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { authService } from '@/services/api/auth.service'

export function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })
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
      const response = await authService.login(formValues.email, formValues.password)
      const { token, user } = response.data
      const normalizedUser = user.dataValues || user

      login(token, normalizedUser)
      const nextPath = normalizedUser.rol === 'tecnico' ? '/proyectos' : '/dashboard'
      router.push(nextPath)
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error?.message
        || error.response?.data?.message
        || 'Error al iniciar sesión'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 px-4 py-10">

      <AuthCard>
        <FeedbackMessage message={errorMessage} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField label="Email">
            <TextInput
              type="email"
              value={formValues.email}
              onChange={handleChange('email')}
              placeholder="tu@email.com"
              required
            />
          </FormField>

          <FormField label="Contraseña">
            <TextInput
              type="password"
              value={formValues.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              required
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5 disabled:opacity-60"
          >
            {isSubmitting ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </form>


      </AuthCard>
    </div>
  )
}