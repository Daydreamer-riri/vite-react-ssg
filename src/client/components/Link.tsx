import type { Ref } from 'react'
import type { LinkProps, NavLinkProps } from 'react-router-dom'
import React, { forwardRef } from 'react'
import { Link as RRLink, NavLink as RRNavLink, useLinkClickHandler } from 'react-router-dom'

/**
 * @deprecated Please use `Link` from 'react-router-dom' instead.
 */
export const Link = forwardRef((props: LinkProps, ref: Ref<HTMLAnchorElement>) => {
  const {
    replace,
    state,
    target,
    preventScrollReset,
    relative,
    to,
    onClick,
  } = props

  const internalOnClick = useLinkClickHandler(to, {
    replace,
    state,
    target,
    preventScrollReset,
    relative,
  })

  function handleClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    if (onClick)
      onClick(event)
    if (!event.defaultPrevented) {
      React.startTransition(() => {
        internalOnClick(event)
      })
    }

    event.defaultPrevented = true
    event.preventDefault()
  }

  return (
    <RRLink {...props} ref={ref} onClick={handleClick} />
  )
})

Link.displayName = 'Link'

/**
 * @deprecated Please use `NavLink` from 'react-router-dom' instead.
 */
export const NavLink = forwardRef((props: NavLinkProps, ref: Ref<HTMLAnchorElement>) => {
  const {
    replace,
    state,
    target,
    preventScrollReset,
    relative,
    to,
    onClick,
  } = props

  const internalOnClick = useLinkClickHandler(to, {
    replace,
    state,
    target,
    preventScrollReset,
    relative,
  })

  function handleClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    if (onClick)
      onClick(event)
    if (!event.defaultPrevented) {
      React.startTransition(() => {
        internalOnClick(event)
      })
    }

    event.defaultPrevented = true
    event.preventDefault()
  }

  return (
    <RRNavLink {...props} ref={ref} onClick={handleClick} />
  )
})

NavLink.displayName = 'NavLink'
