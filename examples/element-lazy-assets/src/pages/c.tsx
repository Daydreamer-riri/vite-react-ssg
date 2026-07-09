import type { ReactNode } from 'react'
import { sharedClassName } from '../shared-style'
import './c.css'

export default function PageC(): ReactNode {
  return <main className={`${sharedClassName} page-c-only`}>Element Lazy Page C</main>
}
