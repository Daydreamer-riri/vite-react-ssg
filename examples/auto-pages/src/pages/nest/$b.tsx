import { useParams } from 'react-router-dom'

export default function Nest() {
  const param = useParams()

  return (
    <div>{ JSON.stringify(param) }</div>
  )
}
