import { useEffect, useState } from 'react'

export default function useIsClient() {
  const [isBrowser, setIsBrowser] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setIsBrowser(true)
  }, [])

  return isBrowser
}
