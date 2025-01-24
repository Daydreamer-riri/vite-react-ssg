import { lazy } from 'react'
import { Link as RRLink } from 'react-router-dom'
import { ClientOnly, Link } from 'vite-react-ssg'
import styles from './a.module.scss'

const ACount = lazy(() => import('../components/a-count'))

export default function A() {
  return (
    <>
      <h1 className={styles.a}>Page A</h1>
      <Link to="/" className={styles.b}>to index</Link>
      <RRLink to="/">to index by RRLink</RRLink>
      <ACount />
      <ClientOnly>
        {() => {
          return <div>{window.location.href}</div>
        }}
      </ClientOnly>
    </>
  )
}
