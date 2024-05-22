import { useLoaderData } from 'react-router-dom'

export default function Docs() {
  const json = useLoaderData() as typeof import('../docs/test.json')

  return (
    <div>{json.key}</div>
  )
}

export const Component = Docs

export const entry = 'src/pages/json.tsx'

export async function loader() {
  // If you use `import('../docs/test.json?raw')`, it will return a JSON string.
  const json = (await import('../docs/test.json')).default

  return json
}
