import { startTransition, useState } from 'react'
import { Link } from 'vite-react-ssg'
import reactLogo from '../assets/react.svg'

// import { Link, useNavigate } from 'react-router-dom'

export default function Index() {
  const [count, setCount] = useState(0)
  // const navigate = useNavigate()

  return (
    <>
      <div>
        <img src={reactLogo} />
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button type="button" onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <button type="button" onClick={() => startTransition(() => void 0)}>
          to A
        </button>
        <Link to="/a">TO A</Link>
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
