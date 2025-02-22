import type { ReactNode } from 'react'
import type { HelmetProps } from 'react-helmet-async'
import React from 'react'
import { Helmet } from 'react-helmet-async'

export type Props = HelmetProps & { children: ReactNode }

export default function Head(props: Props): React.ReactNode {
  return <Helmet {...props} />
}
