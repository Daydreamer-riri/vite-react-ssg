import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import './layout.css'

export default function Layout() {
  return (
    <>
      {/* <Head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>head test</title>
      </Head> */}
      <main>
        <h1 className="layout">Layout</h1>
        <Suspense>
          <Outlet />
        </Suspense>
      </main>
    </>
  )
}
