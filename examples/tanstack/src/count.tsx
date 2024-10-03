import { useState } from 'react'

export function Count() {
  const [count, setCount] = useState(0)

  return (
    <button
      className="w-20 bg-gray"
      type="button"
      onClick={() => setCount(count + 1)}
    >
      {count}
    </button>
  )
}
