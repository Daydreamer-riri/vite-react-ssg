import { useParams } from 'react-router-dom'

export function B() {
  const { b } = useParams()
  return (
    <div>{b}</div>
  )
}

export default B

export function getStaticPaths() {
  return ['nest/b1', 'nest/b2']
}
