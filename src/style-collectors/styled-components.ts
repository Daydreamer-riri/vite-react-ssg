import type { ReactElement } from 'react'
import { ServerStyleSheet } from 'styled-components'

async function ssrCollector() {
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

export default ssrCollector
