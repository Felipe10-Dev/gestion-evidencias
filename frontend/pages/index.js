import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen bg-blue-600">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Cargando...</h1>
        <p>Redirigiendo al login</p>
      </div>
    </div>
  )
}
