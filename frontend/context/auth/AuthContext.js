import { createContext, useContext, useEffect, useState } from 'react'

import {
  clearSessionStorage,
  getStoredToken,
  getStoredUser,
  saveSessionStorage,
} from '@/utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const storedToken = getStoredToken()
    const storedUser = getStoredUser()

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(storedUser)
    } else {
      clearSessionStorage()
    }

    setIsReady(true)
  }, [])

  const login = (nextToken, nextUser) => {
    saveSessionStorage(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    clearSessionStorage()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token && user),
        isReady,
        login,
        logout,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}