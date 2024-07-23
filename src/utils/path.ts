export function joinUrlSegments(a: string, b: string): string {
  if (!a || !b)
    return a || b || ''

  if (a[a.length - 1] === '/')
    a = a.substring(0, a.length - 1)

  if (b[0] !== '/')
    b = `/${b}`

  return a + b
}

export function removeLeadingSlash(str: string): string {
  return str[0] === '/' ? str.slice(1) : str
}

export function stripBase(path: string, base: string): string {
  if (path === base)
    return '/'

  const devBase = withTrailingSlash(base)
  return path.startsWith(devBase) ? path.slice(devBase.length - 1) : path
}

export function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== '/')
    return `${path}/`

  return path
}

export function withLeadingSlash(path: string): string {
  if (path[0] !== '/')
    return `/${path}`
  return path
}
