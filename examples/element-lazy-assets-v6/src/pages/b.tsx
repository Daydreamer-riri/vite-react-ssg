import type { ReactNode } from 'react'
import { sharedClassName } from '../shared-style'

export default function PageB(): ReactNode {
  return <main className={sharedClassName}>Element Lazy Page B</main>
}
