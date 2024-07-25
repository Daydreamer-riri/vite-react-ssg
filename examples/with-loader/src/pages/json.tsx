import { useLoaderData } from 'react-router-dom'

export default function Docs() {
  const data = useLoaderData() as Awaited<ReturnType<typeof loader>>

  return (
    <>
      <div>{data.key}</div>
      <pre>{data.packageJson}</pre>
    </>
  )
}

export const Component = Docs

export const entry = 'src/pages/json.tsx'

export async function loader() {
  // If you use `import('../docs/test.json?raw')`, it will return a JSON string.
  const fs = (await import('node:fs'))
  const cwd = process.cwd()
  const json = (await import('../docs/test.json')).default
  const packageJson = await fs.promises.readFile(`${cwd}/package.json`, 'utf-8')

  return {
    ...json,
    packageJson,
  }
}
