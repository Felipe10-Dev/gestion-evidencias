export function AuthCard({ children }) {
  return (
    <div className="panel-surface w-full max-w-[420px] rounded-[1.75rem] px-8 py-10 sm:px-10">
      {/* Logo mark */}
      <div className="mb-7 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-[0_8px_28px_rgba(27,99,231,0.38)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
      </div>

      <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-slate-900">Bienvenido de vuelta</h1>
      <p className="mb-8 text-center text-sm text-slate-500">Ingresa tus credenciales para continuar</p>

      {children}
    </div>
  )
}