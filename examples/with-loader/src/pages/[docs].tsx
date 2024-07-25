/* eslint-disable no-console */
import type { Params } from 'react-router-dom'
import { Link, useLoaderData, useParams } from 'react-router-dom'

export default function Docs() {
  const doc = useLoaderData() as string
  const { docs } = useParams()
  const anotherPage = docs === 'a' ? 'b' : 'a'

  return (
    <>
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <div dangerouslySetInnerHTML={{ __html: doc }} />
      <Link to={`/docs/${anotherPage}`}>{anotherPage}</Link>
    </>
  )
}

export const Component = Docs

export const entry = 'src/pages/[docs].tsx'

export async function loader({ params }: { params: Params<string> }) {
  console.log('🚀 ~ loader ~ params:', params)
  const doc = await import(`../docs/${params.docs}.md`)
  const { renderToString } = await import('react-dom/server')
  const html = renderToString(<doc.default />)

  return html
}

export function getStaticPaths() {
  const docs = import.meta.glob('../docs/*.md')
  return Object.keys(docs).map(path => path.match(/\.(\/docs\/.*)\.md$/)?.[1] ?? '')
}
