import type { ReactNode } from 'react'
import { sharedClassName } from '../shared-style'
import './b.css'

export default function PageB(): ReactNode {
  return <main className={`${sharedClassName} page-b-only`}>Element Lazy Page B</main>
}
