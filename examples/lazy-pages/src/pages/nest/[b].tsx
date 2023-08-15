export function B() {
  return (
    <div>B</div>
  )
}

export default B

export function getStaticPaths() {
  return ['nest/b1', 'nest/b2']
}
