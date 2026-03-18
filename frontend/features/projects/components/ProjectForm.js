import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { FormField, TextAreaInput, TextInput } from '@/components/ui/FormField'

export function ProjectForm({
  errorMessage,
  formValues,
  isSubmitting,
  onChange,
  onCancel,
  onSubmit,
  submitLabel = 'Crear Proyecto',
  submittingLabel = 'Creando...',
}) {
  return (
    <div className="panel-surface max-w-2xl rounded-2xl p-8">
      <FeedbackMessage message={errorMessage} />

      <form onSubmit={onSubmit} className="space-y-6">
        <FormField label="Nombre del Proyecto">
          <TextInput
            type="text"
            value={formValues.nombre}
            onChange={onChange('nombre')}
            placeholder="Ej: Reparación de línea de teléfono"
            required
          />
        </FormField>

        <FormField label="Descripción">
          <TextAreaInput
            value={formValues.descripcion}
            onChange={onChange('descripcion')}
            placeholder="Descripción detallada del proyecto"
            rows="4"
          />
        </FormField>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-6 py-2.5 disabled:opacity-60"
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-soft px-6 py-2.5"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}