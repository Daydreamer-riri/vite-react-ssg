import type { ReactElement } from 'react'
import React from 'react'
import * as ReactDOM from 'react-dom'

export interface RootType {
  render: (container: ReactElement) => void
  _unmount: () => void
}
export interface RootTypeReact extends RootType {
  unmount?: () => void
}
export type CreateRootFnType = (container: Element | DocumentFragment) => RootTypeReact

export type HydrateRootFnType = (container: Element | DocumentFragment, initialChildren: React.ReactNode) => RootTypeReact

const CopyReactDOM = {
  ...ReactDOM,
} as typeof ReactDOM & {
  createRoot: CreateRootFnType
  hydrateRoot: HydrateRootFnType
}

const { version, render: reactRender, hydrate: reactHydrate } = CopyReactDOM

const isReact18 = Number((version || '').split('.')[0]) > 17

interface RenderOptions {
  useLegacyRender?: boolean
}

export function render(app: JSX.Element, container: Element | DocumentFragment, renderOptions: RenderOptions = {}) {
  const { useLegacyRender } = renderOptions

  if (useLegacyRender || !isReact18) {
    reactRender(app, container)
  }
  else {
    const { createRoot } = CopyReactDOM
    if (!createRoot) {
      throw new Error('createRoot not found')
    }
    const root = createRoot(container)
    React.startTransition(() => {
      root.render(app)
    })
  }
}

export function hydrate(app: JSX.Element, container: Element | DocumentFragment, renderOptions: RenderOptions = {}) {
  const { useLegacyRender } = renderOptions

  if (useLegacyRender || !isReact18) {
    reactHydrate(app, container)
  }
  else {
    const { hydrateRoot } = CopyReactDOM
    if (!hydrateRoot) {
      throw new Error('hydrateRoot not found')
    }
    React.startTransition(() => {
      hydrateRoot(container, app)
    })
  }
}
