import * as React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { registerPaths } from 'vite-react-ssg/tanstack'

export const Route = createLazyFileRoute('/dynamic/$param')({
  component: ParamComponent,
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
