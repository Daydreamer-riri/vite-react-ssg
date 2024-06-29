import { useState } from 'react'
import './a-count.css'

export default function ACount({ onClick }: { onClick: (value: number) => void }) {
  const [count, setCount] = useState(0)

  return (
    <button
      className="a-count"
      onClick={() => {
        setCount(prev => ++prev)
        onClick?.(count + 1)
      }}
      type="button"
    >{count}
    </button>
  )
}
