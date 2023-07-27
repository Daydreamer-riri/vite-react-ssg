import { lazy } from 'react'
import { ClientOnly, Link } from 'vite-react-ssg'
import { Link as RRLink } from 'react-router-dom'
import styled from 'styled-components'

const H1 = styled.h1`
  background: #bbb;
  color: #333444;
`

const ACount = lazy(() => import('../components/a-count'))

export default function A() {
  return (
    <>
      <H1>Page A</H1>
      <Link to={'/'}>to index</Link>
      <RRLink to={'/'}>to index by RRLink</RRLink>
      <ACount />
      <ClientOnly>
        {() => {
          return <div>{window.location.href}</div>
        }}
      </ClientOnly>
    </>
  )
}
