export function FeedbackMessage({ message, tone = 'error' }) {
  if (!message) return null

  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${styles[tone] || styles.error}`}>
      {message}
    </div>
  )
}