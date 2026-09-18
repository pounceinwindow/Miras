import { useEffect, useState } from 'react'
// Keeps page code independent of synchronous mocks; HTTP can replace the API later.
export function useApiQuery<T>(
  query: (key: string) => Promise<T>,
  key: string,
) {
  const [result, setResult] = useState<{
    key: string
    data?: T
    error?: string
  }>()
  useEffect(() => {
    let cancelled = false
    query(key)
      .then((data) => {
        if (!cancelled) setResult({ key, data })
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setResult({
            key,
            error:
              error instanceof Error
                ? error.message
                : 'Не удалось загрузить данные',
          })
      })
    return () => {
      cancelled = true
    }
  }, [query, key])
  return result?.key === key ? result : undefined
}
