import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/json')({
  component: Json,
  loader: async () => {
  // The code here will not be executed on the client side, and the modules imported will not be sent to the client.
    const fs = (await import('node:fs'))
    const cwd = process.cwd()

    const packageJson = await fs.promises.readFile(`${cwd}/package.json`, 'utf-8')
    const { codeToHtml } = await import('shiki')
    const packageJsonHtml = await codeToHtml(packageJson, { lang: 'json', theme: 'vitesse-dark' })

    return {
      packageJson,
      packageJsonHtml,
    }
  },
})

function Json() {
  const loaderData = Route.useLoaderData()
  return (
    // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
    <div dangerouslySetInnerHTML={{ __html: loaderData.packageJsonHtml }}></div>
  )
}
