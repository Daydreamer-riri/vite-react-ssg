import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Head } from 'vite-react-ssg'

export default function Layout() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/react.svg" />
        <title>plugin-mode multi-route</title>
      </Head>
      <nav style={{ display: 'flex', gap: 12, padding: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <main>
        <Suspense>
          <Outlet />
        </Suspense>
      </main>
    </>
  )
}
