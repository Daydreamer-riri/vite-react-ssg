import React, { isValidElement } from 'react'
import useIsBrowser from '../hooks/useIsClient'

// Similar comp to the one described here:
// https://www.joshwcomeau.com/react/the-perils-of-rehydration/#abstractions

export interface ClientOnlyProps {
  children?: () => JSX.Element
  fallback?: JSX.Element
}

export default function ClientOnly({
  children,
  fallback,
}: ClientOnlyProps): JSX.Element | null {
  const isBrowser = useIsBrowser()

  if (isBrowser) {
    if (
      typeof children !== 'function'
        && process.env.NODE_ENV === 'development'
    ) {
      throw new Error(`vite-react-ssg error: The children of <ClientOnly> must be a "render function", e.g. <ClientOnly>{() => <span>{window.location.href}</span>}</ClientOnly>.
Current type: ${isValidElement(children) ? 'React element' : typeof children}`)
    }
    return <>{children?.()}</>
  }

  return fallback ?? null
}
