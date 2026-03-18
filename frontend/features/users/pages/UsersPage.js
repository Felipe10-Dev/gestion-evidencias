import { useState } from 'react'

import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { LoadingState } from '@/components/ui/LoadingState'
import { FormField, SelectInput, TextInput } from '@/components/ui/FormField'
import { useToast } from '@/context/toast/ToastContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { authService } from '@/services/api/auth.service'

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10a2.121 2.121 0 0 0-3-3L5 17v3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  )
}

const INITIAL_FORM_VALUES = {
  nombre: '',
  email: '',
  password: '',
  rol: 'tecnico',
}

export function UsersPage() {
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userPendingDelete, setUserPendingDelete] = useState(null)
  const [deletingUserId, setDeletingUserId] = useState(null)

  const { data: users = [], isLoading, setData: setUsers } = useAsyncData(async () => {
    const response = await authService.getUsers()
    return response.data
  }, [], [])

  const isEditing = Boolean(editUser)

  const handleChange = (fieldName) => (event) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: event.target.value,
    }))
  }

  const handleOpenCreate = () => {
    setEditUser(null)
    setErrorMessage('')
    setFormValues(INITIAL_FORM_VALUES)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user) => {
    setEditUser(user)
    setErrorMessage('')
    setFormValues({
      nombre: user.nombre,
      email: user.email,
      password: '',
      rol: user.rol,
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (isSubmitting) return
    setIsModalOpen(false)
    setEditUser(null)
    setErrorMessage('')
    setFormValues(INITIAL_FORM_VALUES)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      if (isEditing) {
        const payload = {
          nombre: formValues.nombre.trim(),
          email: formValues.email.trim(),
          rol: formValues.rol,
        }

        if (formValues.password.trim()) {
          payload.password = formValues.password
        }

        const response = await authService.updateUser(editUser.id, payload)
        const updatedUser = response.data.user

        setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
        showToast({ title: 'Usuario actualizado', description: 'Los cambios se guardaron correctamente.' })
      } else {
        const response = await authService.register(
          formValues.nombre.trim(),
          formValues.email.trim(),
          formValues.password,
          formValues.rol
        )
        const nextUser = response.data.user?.dataValues || response.data.user

        setUsers((prev) => [nextUser, ...prev])
        showToast({ title: 'Usuario creado', description: 'El nuevo usuario fue creado correctamente.' })
      }

      handleCloseModal()
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.response?.data?.error || 'No se pudo guardar el usuario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestDelete = (user) => {
    setUserPendingDelete(user)
  }

  const handleCloseDeleteModal = () => {
    if (deletingUserId) return
    setUserPendingDelete(null)
  }

  const handleDeleteUser = async () => {
    if (!userPendingDelete) return
    setDeletingUserId(userPendingDelete.id)

    try {
      await authService.removeUser(userPendingDelete.id)
      setUsers((prev) => prev.filter((user) => user.id !== userPendingDelete.id))
      showToast({ title: 'Usuario eliminado', description: 'El usuario se eliminó correctamente.' })
      setUserPendingDelete(null)
    } catch (error) {
      showToast({
        title: 'Error al eliminar',
        description: error.response?.data?.message || error.response?.data?.error || 'No se pudo eliminar el usuario.',
        tone: 'error',
      })
    } finally {
      setDeletingUserId(null)
    }
  }

  if (isLoading) {
    return <LoadingState label="Cargando usuarios..." />
  }

  return (
    <>
      <div className="panel-surface overflow-x-auto rounded-2xl">
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-800">Usuarios ({users.length})</h3>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nuevo usuario
          </button>
        </div>

        <table className="min-w-full">
          <thead className="bg-slate-100/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Correo</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Contraseña</th>
              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 hover:bg-white/70">
                  <td className="px-6 py-4 font-semibold text-slate-800">{user.nombre}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 capitalize">{user.rol}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm font-semibold tracking-wider text-slate-400">••••••••</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        title="Editar usuario"
                        onClick={() => handleOpenEdit(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        title="Eliminar usuario"
                        onClick={() => handleRequestDelete(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 sm:px-6">
          <button
            type="button"
            aria-label="Cerrar formulario"
            onClick={handleCloseModal}
            className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]"
          />

          <div className="panel-surface animated-in relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{isEditing ? 'Editar usuario' : 'Crear nuevo usuario'}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-blue-300 hover:text-blue-700"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6 18 18" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
                </svg>
              </button>
            </div>

            <FeedbackMessage message={errorMessage} />

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <FormField label="Nombre">
                <TextInput
                  type="text"
                  value={formValues.nombre}
                  onChange={handleChange('nombre')}
                  placeholder="Nombre completo"
                  required
                />
              </FormField>

              <FormField label="Email">
                <TextInput
                  type="email"
                  value={formValues.email}
                  onChange={handleChange('email')}
                  placeholder="usuario@email.com"
                  required
                />
              </FormField>

              <FormField label={isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
                <TextInput
                  type="password"
                  value={formValues.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  required={!isEditing}
                />
              </FormField>

              <FormField label="Rol">
                <SelectInput value={formValues.rol} onChange={handleChange('rol')}>
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Administrador</option>
                </SelectInput>
              </FormField>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!userPendingDelete}
        isSubmitting={!!deletingUserId}
        title="¿Eliminar usuario?"
        description={`Se eliminará "${userPendingDelete?.nombre}" del sistema.`}
        confirmLabel="Sí, eliminar"
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteUser}
      />
    </>
  )
}
