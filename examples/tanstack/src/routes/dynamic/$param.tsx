import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dynamic/$param')({
  loader: ({ params }) => {
    return ['this is a loader data', `in ${params.param}`]
  },
})
