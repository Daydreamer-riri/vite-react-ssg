import type { FilledContext } from 'react-helmet-async'
import type { StyleCollector } from '../../types'

export function extractHelmet(context: FilledContext, styleCollector: StyleCollector | null) {
  const { helmet } = context
  const htmlAttributes = helmet.htmlAttributes.toString()
  const bodyAttributes = helmet.bodyAttributes.toString()
  let titleString = helmet.title.toString()
  if (titleString.split('>')[1] === '</title') {
    titleString = ''
  }
  const metaStrings = [
    titleString,
    helmet.meta.toString(),
    helmet.link.toString(),
    helmet.script.toString(),
  ]
  const styleTag = styleCollector?.toString?.('') ?? ''
  const metaAttributes = metaStrings.filter(Boolean)

  return { htmlAttributes, bodyAttributes, metaAttributes, styleTag }
}
