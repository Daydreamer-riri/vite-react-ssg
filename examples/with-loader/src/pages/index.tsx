import { Link } from 'react-router-dom'
import reactLogo from '../assets/react.svg'

// import { Link, useNavigate } from 'react-router-dom'

export default function Index() {
  return (
    <>
      <div>
        <img src={reactLogo} />
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <Link style={{ display: 'block' }} to="/docs/a">TO A</Link>
        <Link style={{ display: 'block' }} to="/docs/b">TO B</Link>
        <Link style={{ display: 'block' }} to="/json">TO JSON</Link>
      </div>
    </>
  )
}

export const Component = Index
