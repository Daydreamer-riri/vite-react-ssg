import { useLoaderData } from 'react-router-dom'

export default function Docs() {
  const data = useLoaderData() as Awaited<ReturnType<typeof loader>>

  return (
    <>
      <div>{data?.key}</div>
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <div dangerouslySetInnerHTML={{ __html: data?.packageCodeHtml ?? '' }} style={{ textAlign: 'start' }}></div>
    </>
  )
}

export const Component = Docs

export const entry = 'src/pages/json.tsx'

export async function loader() {
  if (!import.meta.env.SSR) {
    return null
  }
  // The code here will not be executed on the client side, and the modules imported will not be sent to the client.
  const fs = (await import('node:fs'))
  const cwd = process.cwd()
  const json = (await import('../docs/test.json')).default

  const packageJson = await fs.promises.readFile(`${cwd}/package.json`, 'utf-8')
  const { codeToHtml } = await import('shiki')
  const packageJsonHtml = await codeToHtml(packageJson, { lang: 'json', theme: 'vitesse-light' })

  return {
    ...json,
    packageCodeHtml: packageJsonHtml,
  }
}
