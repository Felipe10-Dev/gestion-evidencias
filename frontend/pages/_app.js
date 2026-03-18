import '../styles/globals.css'

import { AuthProvider } from '@/context/auth/AuthContext'
import { ToastProvider } from '@/context/toast/ToastContext'
import { AppShell } from '@/components/layout/AppShell'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell>
          <Component {...pageProps} />
        </AppShell>
      </ToastProvider>
    </AuthProvider>
  )
}

export default MyApp
