import type { ReactNode } from 'react'
import { sharedClassName } from '../shared-style'
import './a.css'

export default function PageA(): ReactNode {
  return <main className={`${sharedClassName} page-a-only`}>Element Lazy Page A</main>
}
