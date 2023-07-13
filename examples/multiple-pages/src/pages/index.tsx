import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Index() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate()

  return (
    <>
      <div>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <button onClick={() => navigate('/a')}>
          to A
        </button>
        <Link to={'/a'}>TO A</Link>
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
