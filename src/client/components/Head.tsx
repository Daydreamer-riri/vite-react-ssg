import React from 'react'
import type { ReactNode } from 'react'
import { Helmet } from 'react-helmet-async'
import type { HelmetProps } from 'react-helmet-async'

export type Props = HelmetProps & { children: ReactNode }

export default function Head(props: Props): JSX.Element {
  return <Helmet {...props} />
}
