import { lazy } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ClientOnly } from 'vite-react-ssg'

const H1 = styled.h1`
  background: #bbb;
  color: #333444;
`

const ACount = lazy(() => import('../components/a-count'))

export default function A() {
  return (
    <>
      <H1>Page A</H1>
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
