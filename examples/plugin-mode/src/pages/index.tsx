import { useState } from 'react'
import reactLogo from '../assets/react.svg'

export default function Home() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <img src={reactLogo} />
      </div>
      <h1>Vite + React</h1>
      <h2>vite-react-ssg plugin-mode · multi-route</h2>
      <div className="card">
        <button type="button" onClick={() => setCount(c => c + 1)}>
          count is {count}
        </button>
      </div>
    </>
  )
}
