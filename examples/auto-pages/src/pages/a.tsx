import { lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClientOnly } from 'vite-react-ssg'
import './a.css'

const ACount = lazy(() => import('../components/a-count'))

export default function A() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 className="a">Page A</h1>
      <Link to="/">to index</Link>
      {' '}
      <Link to={`/nest/${count}`}>to nest/{count}</Link>
      <ACount onClick={value => setCount(value)} />
      <ClientOnly>
        {() => {
          return <div>{window.location.href}</div>
        }}
      </ClientOnly>
    </>
  )
}
