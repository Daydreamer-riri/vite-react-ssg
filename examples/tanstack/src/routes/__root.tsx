import * as React from 'react'
import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className="p-2 flex gap-2 text-lg">
        <Link
          to="/"
          activeProps={{
            className: 'font-bold',
          }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>
        {' '}
        <Link
          to="/about"
          activeProps={{
            className: 'font-bold',
          }}
        >
          About
        </Link>
        <Link
          to="/dynamic/$param"
          params={{ param: 'path1' }}
          activeProps={{
            className: 'font-bold',
          }}
        >
          path1
        </Link>
        <Link
          to="/dynamic/$param"
          params={{ param: 'path2' }}
          activeProps={{
            className: 'font-bold',
          }}
        >
          path2
        </Link>
      </div>
      <hr />
      <Outlet />
    </>
  )
}
