import '../styles/globals.css'

import { AuthProvider } from '@/context/auth/AuthContext'
import { ToastProvider } from '@/context/toast/ToastContext'
import { AppShell } from '@/components/layout/AppShell'
import { SpeedInsights } from '@vercel/speed-insights/next'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell>
          <Component {...pageProps} />
        </AppShell>
        <SpeedInsights />
      </ToastProvider>
    </AuthProvider>
  )
}

export default MyApp
