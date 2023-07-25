import { lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientOnly } from 'vite-react-ssg'
import './a.css'

const ACount = lazy(() => import('../components/a-count'))

export default function A() {
  const navigate = useNavigate()
  return (
    <>
      <h1 className="a">Page A</h1>
      <button onClick={() => navigate('/')}>to index</button>
      <ACount />
      <ClientOnly>
        {() => {
          return <div>{window.location.href}</div>
        }}
      </ClientOnly>
    </>
  )
}
