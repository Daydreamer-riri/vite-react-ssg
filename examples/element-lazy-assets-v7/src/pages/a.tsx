import type { ReactNode } from 'react'
import { sharedClassName } from '../shared-style'

export default function PageA(): ReactNode {
  return <main className={sharedClassName}>Element Lazy Page A</main>
}
