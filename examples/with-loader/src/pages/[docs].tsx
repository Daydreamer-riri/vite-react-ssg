import type { Params } from 'react-router-dom'
import { useLoaderData } from 'react-router-dom'

export default function Docs() {
  const doc = useLoaderData() as string

  return (
    // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
    <div dangerouslySetInnerHTML={{ __html: doc }} />
  )
}

export const Component = Docs

export const entry = 'src/pages/[docs].tsx'

export async function loader({ params }: { params: Params<string> }) {
  const doc = await import(`../docs/${params.docs}.md`)
  const { renderToString } = await import('react-dom/server')
  const html = renderToString(<doc.default />)

  return html
}

export function getStaticPaths() {
  const docs = import.meta.glob('../docs/*.md')
  return Object.keys(docs).map(path => path.match(/\.(\/docs\/.*)\.md$/)?.[1] ?? '')
}
