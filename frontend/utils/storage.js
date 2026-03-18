const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getStoredToken() {
  if (!isBrowser()) return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  if (!isBrowser()) return null

  const rawUser = window.localStorage.getItem(USER_KEY)
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    clearSessionStorage()
    return null
  }
}

export function saveSessionStorage(token, user) {
  if (!isBrowser()) return

  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSessionStorage() {
  if (!isBrowser()) return

  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}