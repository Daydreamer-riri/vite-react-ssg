import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import './layout.css'
import './App.css'

export default function Layout() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/react.svg" />
        <title>With loader</title>
      </Head>
      <main>
        <Suspense>
          <Outlet />
        </Suspense>
      </main>
    </>
  )
}
