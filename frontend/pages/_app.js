import '../styles/globals.css'

import { AuthProvider } from '@/context/auth/AuthContext'
import { ToastProvider } from '@/context/toast/ToastContext'
import { AppShell } from '@/components/layout/AppShell'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell>
          <Component {...pageProps} />
        </AppShell>
        <SpeedInsights />
        <Analytics />
      </ToastProvider>
    </AuthProvider>
  )
}

export default MyApp
