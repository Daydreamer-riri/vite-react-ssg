import { lazy } from 'react'
import { ClientOnly, Link } from 'vite-react-ssg'
import './a.css'

const ACount = lazy(() => import('../components/a-count'))

export default function A() {
  return (
    <>
      <h1 className="a">Page A</h1>
      <Link to={'/'}>to index</Link>{' '}
      <Link to={'/nest'}>to nest</Link>
      <ACount />
      <ClientOnly>
        {() => {
          return <div>{window.location.href}</div>
        }}
      </ClientOnly>
    </>
  )
}
