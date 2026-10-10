const FONT_TYPES: Record<string, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
}
const FONT_PRIORITY = Object.keys(FONT_TYPES)
const FONT_RE = /^(.+?)(?:-[\w-]{8})?\.(woff2|woff|ttf|otf)$/

export function renderPreloadLinks(document: Document, assets: Set<string>) {
  const seen = new Set()

  if (assets) {
    const preferredFonts = getPreferredFonts(assets)
    assets.forEach(file => {
      if (FONT_RE.test(file) && !preferredFonts.has(file))
        return
      if (!seen.has(file)) {
        seen.add(file)
        renderPreloadLink(document, file)
      }
    })
  }
}

// A font is usually emitted in several formats (woff2, woff, ttf) as fallbacks.
// Preloading all of them makes the browser download every format, so only the
// best format of each font is preloaded.
function getPreferredFonts(assets: Set<string>) {
  const best = new Map<string, string>()
  assets.forEach(file => {
    const match = file.match(FONT_RE)
    if (!match)
      return
    const [, name, ext] = match
    const current = best.get(name)
    if (!current || FONT_PRIORITY.indexOf(ext) < FONT_PRIORITY.indexOf(current.match(FONT_RE)![2]))
      best.set(name, file)
  })
  return new Set(best.values())
}

function renderPreloadLink(document: Document, file: string) {
  if (file.endsWith('.js')) {
    appendLink(document, {
      rel: 'modulepreload',
      crossOrigin: '',
      href: file,
    })
  }
  else if (file.endsWith('.css')) {
    appendLink(document, {
      rel: 'stylesheet',
      href: file,
      crossOrigin: '',
    })
  }
  else if (FONT_RE.test(file)) {
    appendLink(document, {
      rel: 'preload',
      as: 'font',
      type: FONT_TYPES[file.match(FONT_RE)![2]],
      href: file,
      crossOrigin: '',
    })
  }
  else if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp') || file.endsWith('.gif') || file.endsWith('.ico') || file.endsWith('.svg')) {
    appendLink(document, {
      rel: 'preload',
      as: 'image',
      href: file,
      crossOrigin: '',
    })
  }
}

function createLink(document: Document) {
  return document.createElement('link')
}

function setAttrs(el: Element, attrs: Record<string, any>) {
  const keys = Object.keys(attrs)
  for (const key of keys)
    el.setAttribute(key, attrs[key])
}

function appendLink(document: Document, attrs: Record<string, any>) {
  const exits = document.head.querySelector(`link[href='${attrs.href}']`)
  if (exits)
    return
  const link = createLink(document)
  setAttrs(link, attrs)
  document.head.appendChild(link)
}
