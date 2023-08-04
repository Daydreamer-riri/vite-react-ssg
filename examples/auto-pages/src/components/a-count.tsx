import { useState } from 'react'
import './a-count.css'

export default function ACount() {
  const [count, setCount] = useState(0)

  return (
    <button className="a-count" onClick={() => setCount(prev => ++prev)}>{count}</button>
  )
}
