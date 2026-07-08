import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

export default function Layout(): ReactNode {
  return <Outlet />
}
