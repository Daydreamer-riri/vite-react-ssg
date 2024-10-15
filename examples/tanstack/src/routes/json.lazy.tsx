import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/json')({
  component: Json,
})

function Json() {
  const loaderData = Route.useLoaderData()
  return (
    // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
    <div dangerouslySetInnerHTML={{ __html: loaderData.packageJsonHtml }}></div>
  )
}
