import { join } from 'node:path'
import fs from 'fs-extra'

export const SCRIPT_COMMENT_PLACEHOLDER = '/* SCRIPT_COMMENT_PLACEHOLDER */'

export async function renderHTML({
  rootContainerId,
  indexHTML,
  appHTML,
  metaAttributes,
  bodyAttributes,
  htmlAttributes,
  initialState,
}: {
  rootContainerId: string
  indexHTML: string
  appHTML: string
  metaAttributes: string[]
  bodyAttributes: string
  htmlAttributes: string
  initialState: any
},
) {
  const stateScript = initialState
    ? `\n<script>window.__INITIAL_STATE__=${initialState}</script>`
    : ''

  const scriptPlaceHolder = `\n<script>${SCRIPT_COMMENT_PLACEHOLDER}</script>`

  // add head
  const headStartTag = '<head>'
  const metaTags = metaAttributes.join('')
  indexHTML = indexHTML.replace(headStartTag, headStartTag + metaTags)

  // add body attributes
  const bodyStartTag = '<body'
  indexHTML = indexHTML.replace(bodyStartTag, `${bodyStartTag} ${bodyAttributes}`)

  // add html attributes
  const htmlStartTag = '<html'
  indexHTML = indexHTML.replace(htmlStartTag, `${htmlStartTag} ${htmlAttributes}`)

  const container = `<div id="${rootContainerId}"></div>`
  if (indexHTML.includes(container)) {
    return indexHTML
      .replace(
        container,
        `<div id="${rootContainerId}" data-server-rendered="true">${appHTML}</div>${stateScript}${scriptPlaceHolder}`,
      )
  }

  const html5Parser = await import('html5parser')
  const ast = html5Parser.parse(indexHTML)
  let renderedOutput: string | undefined

  html5Parser.walk(ast, {
    enter: node => {
      if (!renderedOutput
        && node?.type === html5Parser.SyntaxKind.Tag
        && Array.isArray(node.attributes)
        && node.attributes.length > 0
        && node.attributes.some(attr => attr.name.value === 'id' && attr.value?.value === rootContainerId)
      ) {
        const attributesStringified = [...node.attributes.map(({ name: { value: name }, value }) => `${name}="${value!.value}"`)].join(' ')
        const indexHTMLBefore = indexHTML.slice(0, node.start)
        const indexHTMLAfter = indexHTML.slice(node.end)
        renderedOutput = `${indexHTMLBefore}<${node.name} ${attributesStringified} data-server-rendered="true">${appHTML}</${node.name}>${stateScript}${indexHTMLAfter}`
      }
    },
  })

  if (!renderedOutput)
    throw new Error(`Could not find a tag with id="${rootContainerId}" to replace it with server-side rendered HTML`)

  return renderedOutput
}

export async function detectEntry(root: string) {
  // pick the first script tag of type module as the entry
  // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-useless-non-capturing-group, regexp/no-dupe-characters-character-class, regexp/no-useless-lazy, regexp/no-useless-flag, regexp/no-useless-escape, regexp/strict
  const scriptSrcReg = /<script(?:.*?)src=["'](.+?)["'](?!<)(?:.*)\>(?:[\n\r\s]*?)(?:<\/script>)/gim
  const html = await fs.readFile(join(root, 'index.html'), 'utf-8')
  const scripts = [...html.matchAll(scriptSrcReg)] || []
  const [, entry] = scripts.find(matchResult => {
    const [script] = matchResult
    const [, scriptType] = script.match(/.*\stype=(?:'|")?([^>'"\s]+)/i) || []
    return scriptType === 'module'
  }) || []
  return entry || 'src/main.ts'
}

export function createLink(href: string) {
  return `<link rel="stylesheet" href="${href}">`
}
