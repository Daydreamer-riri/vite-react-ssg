import { useState } from 'react'
import './App.css'
import reactLogo from './assets/react.svg'

export default function Index() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <img src={reactLogo} />
      </div>
      <h1>Vite + React</h1>
      <h2>vite-react-ssg single-page</h2>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}
