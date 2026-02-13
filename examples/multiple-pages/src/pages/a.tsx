import { lazy } from 'react'
import { Link } from 'react-router-dom'
import { ClientOnly } from 'vite-react-ssg'
import './a.css'

const ACount = lazy(() => import('../components/a-count'))

export default function A() {
  return (
    <>
      <h1 className="a">Page A</h1>
      <Link to="/">to index</Link>
      <ACount />
      <ClientOnly>
        {() => {
          return <div>{window.location.href}</div>
        }}
      </ClientOnly>
    </>
  )
}
