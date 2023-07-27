import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import './layout.css'

export default function Layout() {
  const [state, setState] = useState(false)

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/react.svg" />
        <title>head test {state ? 'A' : 'B'}</title>
        <body className={`body-class-in-head-${state ? 'a' : 'b'}`} />
      </Head>
      <main>
        <h1 className="layout">Layout</h1>
        <Suspense>
          <Outlet />
        </Suspense>
        <div>
          <button onClick={() => setState(v => !v)}>layout change title</button>
        </div>
      </main>
    </>
  )
}
