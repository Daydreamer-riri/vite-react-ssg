import { useState } from 'react'
import clsx from 'clsx'
import { Head, Link, NavLink } from 'vite-react-ssg'
import { Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const handleMenuItemClick = () => {
    setMenuOpen(false)
  }

  const { pathname } = useLocation()
  const title = `Vite React SSG${pathname === '/' ? '' : ` - ${pathname.split('/').pop()}`}`
  // const state = React.useMemo<'idle' | 'loading'>(
  //   () => {
  //     const states = [
  //       transition.state,
  //       ...fetchers.map(fetcher => fetcher.state),
  //     ]
  //     if (states.every(state => state === 'idle'))
  //       return 'idle'
  //     return 'loading'
  //   },
  //   [transition.state, fetchers],
  // )

  return (
    <div className="dark:bg-d-bg font-mono bg-l-bg relative overflow-y-scroll h-screen dark:text-d-fg text-l-fg">
      <Head>
        <title>{title}</title>
      </Head>
      <header className="h-24 sm:h-32 flex items-center z-20 w-full">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="uppercase text-l-fgDeep dark:text-d-fgDeep font-black text-3xl flex items-center">
            <Link to="/">
              <h1>Vite React SSG</h1>
            </Link>
          </div>
          <div className="flex items-center relative">
            <nav
              className={clsx(
                'font-sen text-l-fgDeeper dark:text-d-fgDeeper uppercase text-lg sm:flex items-center',
                'absolute sm:relative top-full right-0 dark:bg-gray-800 bg-gray-100 z-30',
                !menuOpen && 'hidden',
              )}
            >
              <NavLink
                end
                onClick={handleMenuItemClick}
                to="/"
                className="py-2 px-6 flex op-60 hover:op-100"
              >
                Home
              </NavLink>
              <NavLink
                onClick={handleMenuItemClick}
                to="docs/Getting-Started"
                className="py-2 px-6 flex op-60 hover:op-100"
              >
                Docs
              </NavLink>
              <a
                href="https://github.com/Daydreamer-riri/vite-react-ssg"
                className="py-2 px-6 flex op-60 hover:op-100"
                rel="noopener noreferrer"
                target="_blank"
              >
                Repo
              </a>
              <button
                type="button"
                title="Toggle Color Scheme"
                className="py-2 px-6 pl-2 op-60 hover:op-100"
                onClick={() => toggleTheme()}
              >
                <div className="i-ri-sun-line dark:i-ri-moon-line"></div>
              </button>
            </nav>
            <button
              title="Menu"
              className="sm:hidden flex flex-col ml-4"
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
            >
              <span className="w-6 h-1 bg-gray-800 dark:bg-white mb-1" />
              <span className="w-6 h-1 bg-gray-800 dark:bg-white mb-1" />
              <span className="w-6 h-1 bg-gray-800 dark:bg-white mb-1" />
            </button>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  )
}
