import { useLoaderData } from 'react-router-dom'

export default function PageWithLoader() {
  const Comp: any = useLoaderData()

  return (
    <div>
      <h1>Page with loader</h1>
      {/* <Comp /> */}
      {Comp}
    </div>
  )
}
