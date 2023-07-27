import type { ReactElement } from 'react'

async function ssrCollector() {
  const { ServerStyleSheet } = await import('styled-components')

  const sheet = new ServerStyleSheet()

  return {
    collect(app: ReactElement) {
      return sheet.collectStyles(app)
    },
    toString() {
      return sheet.getStyleTags()
    },
    cleanup() {
      sheet.seal()
    },
  }
}

export default import.meta.env.SSR ? ssrCollector : null
