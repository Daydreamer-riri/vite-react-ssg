import { useNavigate } from 'react-router-dom'
import './a.css'

export default function A() {
  const navigate = useNavigate()
  return (
    <>
      <h1 className="a">Page A</h1>
      <button onClick={() => navigate('/')}>to index</button>
    </>
  )
}
