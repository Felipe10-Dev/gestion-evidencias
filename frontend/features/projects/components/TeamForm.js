import Link from 'next/link'

import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextInput } from '@/components/ui/FormField'

export function TeamForm({ errorMessage, goBackHref, isSubmitting, onChange, onSubmit, submitLabel = 'Crear Equipo', teamName }) {
  return (
    <div className="panel-surface max-w-2xl rounded-2xl p-8">
      <FeedbackMessage message={errorMessage} />

      <form onSubmit={onSubmit} className="space-y-6">
        <FormField label="Nombre del Equipo">
          <TextInput
            type="text"
            value={teamName}
            onChange={onChange}
            placeholder="Ej: Equipo A - Zona Norte"
            required
          />
        </FormField>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-6 py-2.5 disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : submitLabel}
          </button>
          <Link
            href={goBackHref}
            className="btn-soft px-6 py-2.5 text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}