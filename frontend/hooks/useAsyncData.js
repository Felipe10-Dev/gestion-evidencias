import { useEffect, useState } from 'react'

export function useAsyncData(asyncFn, dependencies = [], initialValue = null) {
  const [data, setData] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = () => {
    setReloadToken((current) => current + 1)
  }

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await asyncFn()
        if (isMounted) {
          setData(result)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [...dependencies, reloadToken])

  return { data, error, isLoading, setData, refetch }
}