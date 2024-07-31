import { Outlet, ScrollRestoration } from 'react-router-dom'
import { NavLink } from 'vite-react-ssg'

const docsList = ['Getting-Started', 'API', 'Components', 'Integration', 'Configuration']

export default function Layout() {
  return (
    <div className="container mx-auto mt-4 pt-12">
      <ScrollRestoration />
      <div className="flex flex-wrap">
        <div className="w-full sm:w-3/12 lg:w-2/12 pr-4 tex-left">
          <div className="block overflow-y-auto pt-8 pb-4 border-r-1 border-l-border dark:border-d-border sticky top-8">
            <div className="mb-6">
              <ul className="block flex-wrap list-none pl-0 mb-0 mt-0">
                {docsList.map(title => (
                  <li key={title}>
                    <NavLink
                      className={({ isActive }) => `text-lg block mb-2 mx-4 no-underline hover:op-80 ${isActive ? 'op-100!' : 'op-50'}`}
                      to={title}
                    >
                      {title.replace(/-/g, ' ')}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-9/12 lg:w-8/12 px-4 sm:pr-10 lg:pr-4 ml-4">
          <div className="my-8">
            <article className="prose lg:prose-xl dark:prose-invert max-w-3xl">
              <Outlet />
            </article>
          </div>
        </div>
        <div className="w-full lg:w-2/12 px-4 hidden lg:block" />
      </div>
    </div>
  )
}
