/**
 * Fetches a static loader data file (the manifest or a page's data) emitted by
 * the build.
 *
 * Resolves to `undefined` when the response is not usable data, e.g. the
 * host's 404 page or an SPA fallback `index.html` served with status 200. That
 * means the file belongs to a build that is no longer deployed. Network errors
 * are not swallowed.
 */
export async function fetchStaticLoaderData<T>(url: string): Promise<T | undefined> {
  const response = await fetch(url)
  if (!response.ok)
    return undefined

  try {
    return await response.json() as T
  }
  catch {
    return undefined
  }
}

/**
 * Loads `url` as a new document instead of failing inside the router, so the
 * browser picks up the currently deployed build. The returned promise never
 * settles, keeping the router pending until the browser navigates away.
 *
 * Throws instead when `url` is the current document (e.g. a loader running
 * during hydration or a revalidation), because reloading would hit the same
 * failure again and loop.
 */
export function loadDocument(
  url: string,
  location: Pick<Location, 'href' | 'assign'> = window.location,
): Promise<never> {
  if (isCurrentDocument(url, location.href)) {
    throw new Error(
      `[vite-react-ssg] Static loader data for ${url} is not available.`,
    )
  }

  location.assign(url)
  return new Promise(() => {})
}

function isCurrentDocument(url: string, currentHref: string): boolean {
  const target = new URL(url, currentHref)
  const current = new URL(currentHref)
  target.hash = ''
  current.hash = ''
  return target.href === current.href
}
