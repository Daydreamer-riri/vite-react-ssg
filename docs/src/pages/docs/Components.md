# Components

## `<ClientOnly/>`

If you need to render some component in browser only, you can wrap your component with `<ClientOnly>`.

```tsx
import { ClientOnly } from 'vite-react-ssg'

function MyComponent() {
  return (
    <ClientOnly>
      {() => {
        return <div>{window.location.href}</div>
      }}
    </ClientOnly>
  )
}
```

> It's important that the children of `<ClientOnly>` is not a JSX element, but a function that returns an element.
> Because React will try to render children, and may use the client's API on the server.

## Document head

You can use `<Head/>` to manage all of your changes to the document head. It takes plain HTML tags and outputs plain HTML tags. It is a wrapper around [React Helmet](https://github.com/nfl/react-helmet).

```tsx
import { Head } from 'vite-react-ssg'

function MyHead() {
  return (
    <Head>
      <meta property="og:description" content="My custom description" />
      <meta charSet="utf-8" />
      <title>My Title</title>
      <link rel="canonical" href="http://mysite.com/example" />
    </Head>
  )
}
```

Nested or latter components will override duplicate usages:

```tsx
import { Head } from 'vite-react-ssg'

function MyHead() {
  return (
    <parent>
      <Head>
        <title>My Title</title>
        <meta name="description" content="Helmet application" />
      </Head>
      <child>
        <Head>
          <title>Nested Title</title>
          <meta name="description" content="Nested component" />
        </Head>
      </child>
    </parent>
  )
}
```

Outputs:

```html
<head>
  <title>Nested Title</title>
  <meta name="description" content="Nested component" />
</head>
```

### Reactive head

```tsx
import { useState } from 'react'
import { Head } from 'vite-react-ssg'

export default function MyHead() {
  const [state, setState] = useState(false)

  return (
    <Head>
      <meta charSet="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <title>head test {state ? 'A' : 'B'}</title>
      {/* You can also set the 'body' attributes here */}
      <body className={`body-class-in-head-${state ? 'a' : 'b'}`} />
    </Head>
  )
}
```
