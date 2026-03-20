export const APP_DATA_CHANGED_EVENT = 'app-data-changed'

export function notifyDataChanged(scope = 'all') {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(APP_DATA_CHANGED_EVENT, {
    detail: {
      scope,
      at: Date.now(),
    },
  }))
}

export function subscribeToDataChanges(listener) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const wrappedListener = (event) => {
    listener(event.detail || { scope: 'all' })
  }

  window.addEventListener(APP_DATA_CHANGED_EVENT, wrappedListener)

  return () => {
    window.removeEventListener(APP_DATA_CHANGED_EVENT, wrappedListener)
  }
}