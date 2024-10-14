import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { registerPaths } from 'vite-react-ssg/tanstack'

export const Route = createFileRoute('/dynamic/$param')({
  component: ParamComponent,
  loader: ({ params }) => {
    return ['this is a loader data', `in ${params.param}`]
  },
})

registerPaths('/dynamic/$param', () => ['/dynamic/path1', '/dynamic/path2'])

function ParamComponent() {
  const { param } = Route.useParams()
  const loaderData = Route.useLoaderData()
  return (
    <div className="p-2">
      <h3>Param</h3>
      <p>{param}</p>
      <p>{loaderData.join(', ')}</p>
    </div>
  )
}
