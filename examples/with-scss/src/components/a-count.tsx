import { useState } from 'react'
import './a-count.scss'

export default function ACount() {
  const [count, setCount] = useState(0)

  return (
    <button
      type="button"
      className="a-count"
      onClick={() => setCount(prev => ++prev)}
    >
      {count}
    </button>
  )
}
