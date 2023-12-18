import { Link } from 'vite-react-ssg'
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
        <Link to="/docs/a">TO A</Link>
        {' '}
        <Link to="/docs/b">TO B</Link>
      </div>
    </>
  )
}

export const Component = Index
