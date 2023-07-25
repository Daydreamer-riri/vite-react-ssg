import { useEffect, useState } from 'react'

export default function useIsClient() {
  const [isBrowser, setIsBrowser] = useState(false)

  useEffect(() => {
    setIsBrowser(true)
  }, [])

  return isBrowser
}
