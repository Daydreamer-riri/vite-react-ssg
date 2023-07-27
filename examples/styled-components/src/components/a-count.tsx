import { useState } from 'react'
import styled from 'styled-components'

const Button = styled.button`
  color: red;
`

export default function ACount() {
  const [count, setCount] = useState(0)

  return (
    <Button className="a-count" onClick={() => setCount(prev => ++prev)}>{count}</Button>
  )
}
