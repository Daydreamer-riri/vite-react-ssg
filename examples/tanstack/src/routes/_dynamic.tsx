import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dynamic')({
  component: DynamicComponent,
  loader: () => 'This is dynamic layout loader data',
})

function DynamicComponent() {
  const loaderData = Route.useLoaderData()

  return (
    <div>
      <h2>This is dynamic layout</h2>
      <p>{loaderData}</p>
      <Outlet />
    </div>
  )
}
