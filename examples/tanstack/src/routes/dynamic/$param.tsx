import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { registerPaths } from 'vite-react-ssg/tanstack'

export const Route = createFileRoute('/dynamic/$param')({
  component: ParamComponent,
})

registerPaths('/dynamic/$param', () => ['/dynamic/path1', '/dynamic/path2'])

function ParamComponent() {
  const { param } = Route.useParams()
  return (
    <div className="p-2">
      <h3>Param</h3>
      <p>{param}</p>
    </div>
  )
}
