export function renderPreloadLinks(document: Document, assets: Set<string>) {
  const seen = new Set()

  if (assets) {
    assets.forEach(file => {
      if (!seen.has(file)) {
        seen.add(file)
        renderPreloadLink(document, file)
      }
    })
  }
}

function renderPreloadLink(document: Document, file: string) {
  if (file.endsWith('.js')) {
    // appendLink(document, {
    //   rel: 'modulepreload',
    //   crossOrigin: '',
    //   href: file,
    // })
  }
  else if (file.endsWith('.css')) {
    appendLink(document, {
      rel: 'stylesheet',
      href: file,
      crossOrigin: '',
    })
  }
  else if (file.endsWith('.woff') || file.endsWith('.woff2') || file.endsWith('.ttf')) {
    appendLink(document, {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
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
  const exits = document.head.querySelector(`link[href='${attrs.file}']`)
  if (exits)
    return
  const link = createLink(document)
  setAttrs(link, attrs)
  document.head.appendChild(link)
}
