# AGENTS.md

Guide for AI coding agents working in this repository.

## Project Overview

**vite-react-ssg** is an npm package providing Static Site Generation (SSG) for React applications using Vite. It supports React 17-19, Vite 2-7, and React Router DOM v6.

- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm (v10.28.2)
- **Build System**: unbuild (library), Vite (examples/docs)
- **Test Framework**: Vitest
- **Linting**: ESLint with @ririd/eslint-config (extends @antfu/eslint-config)

## Commands

### Build & Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build the library with unbuild
pnpm dev              # Development mode with stub
pnpm typecheck        # TypeScript type checking
```

### Linting

```bash
pnpm lint             # Run ESLint on all files
```

### Testing

```bash
pnpm test                                    # Build all packages, then run all tests
vitest run                                   # Run tests without rebuilding
vitest run tests/generates.test.ts           # Run a specific test file
vitest run -t "generates"                    # Run tests matching name pattern
vitest run -t "multiple-pages"               # Run specific describe block
vitest --watch                               # Run tests in watch mode
```

Note: `pnpm test` first builds all workspace packages (`pnpm -r build`) before running vitest, which is required since tests verify built example outputs.

## Directory Structure

```
src/
├── client/              # Client-side code (browser)
│   ├── components/      # React components (ClientOnly, Head, Link)
│   ├── hooks/           # Custom React hooks (useIsClient)
│   ├── index.tsx        # Main ViteReactSSG function
│   ├── single-page.tsx  # Single-page SSG variant
│   └── tanstack.tsx     # TanStack Router integration (experimental)
├── node/                # Node.js/build-time code
│   ├── build.ts         # Main SSG build logic
│   ├── cli.ts           # CLI implementation
│   ├── dev.ts           # Development server
│   ├── html.ts          # HTML processing
│   ├── router-adapter/  # Router adapters
│   └── utils.ts         # Node utilities
├── utils/               # Shared utilities (path, state)
├── style-collectors/    # CSS-in-JS support (styled-components)
├── types.ts             # TypeScript type definitions
├── invariant.ts         # Assertion utilities
├── index.ts             # Main export (re-exports client)
└── node.ts              # Node exports
examples/                # Example projects for testing/demos
docs/                    # Documentation site (uses vite-react-ssg)
tests/                   # Test files
```

## Code Style Guidelines

### Imports

1. **Type imports**: Always use `import type` for type-only imports

   ```typescript
   import type { RouteRecord, ViteReactSSGOptions } from '../types'
   import React from 'react'
   ```

2. **Node.js built-ins**: Prefix with `node:` protocol

   ```typescript
   import fs from 'node:fs/promises'
   import { dirname, join } from 'node:path'
   ```

3. **Import order**: Types first, then external packages, then internal modules

### Formatting

- **No semicolons** at end of statements
- **Single quotes** for strings
- **2-space indentation**
- **Trailing commas** in multiline arrays/objects
- **No parentheses** around single arrow function parameters

```typescript
// Correct
const foo = 'bar'
const fn = x => x + 1
```

Avoid: double quotes (`"bar"`), semicolons (`;`), parentheses around single args (`(x) =>`)

### TypeScript

- **Strict mode** enabled with `strictNullChecks`
- **Target**: ES2020
- **Module**: ESNext with Bundler resolution
- **Path alias**: `~/*` maps to `./src/*`

Use `@ts-expect-error` with explanation when type assertions are necessary:

```typescript
// @ts-expect-error global variable
context.initialState = window.__INITIAL_STATE__
```

### Naming Conventions

| Type                | Convention               | Example                              |
| ------------------- | ------------------------ | ------------------------------------ |
| Variables/Functions | camelCase                | `createRoot`, `routesPaths`          |
| React Components    | PascalCase               | `ClientOnly`, `Head`                 |
| Types/Interfaces    | PascalCase               | `ViteReactSSGOptions`, `RouteRecord` |
| Constants           | camelCase or UPPER_SNAKE | `BASE_URL`, `defaultOptions`         |
| Files               | Match primary export     | `ClientOnly.tsx`, `useIsClient.ts`   |

### React Components

- Use **function declarations** with explicit return types
- Export components as **default exports**
- Props interfaces defined above component

```typescript
import type { ReactNode } from 'react'
import React from 'react'

export interface ClientOnlyProps {
  children?: () => ReactNode
  fallback?: ReactNode
}

export default function ClientOnly({
  children,
  fallback,
}: ClientOnlyProps): ReactNode | null {
  // implementation
}
```

### Error Handling

- Console messages prefixed with `[vite-react-ssg]`
- Use kolorist for colored output in Node.js code
- Use `invariant()` for assertions that indicate bugs

```typescript
import { gray, red, yellow } from 'kolorist'

console.log(`${gray('[vite-react-ssg]')} ${yellow('Warning message')}`)
console.error(`${gray('[vite-react-ssg]')} ${red('Error message')}`)

// For bug assertions
invariant(value, 'Expected value to be defined')
```

### Utility Functions

- Keep utilities pure when possible
- Use early returns for guard clauses
- Prefer ternary for simple conditionals

```typescript
export function withLeadingSlash(path: string): string {
  if (path[0] !== '/')
    return `/${path}`
  return path
}
```

## Package Exports

The package has multiple entry points:

| Import Path                                         | Description                                  |
| --------------------------------------------------- | -------------------------------------------- |
| `vite-react-ssg`                                    | Main client (ViteReactSSG with React Router) |
| `vite-react-ssg/single-page`                        | Single-page SSG without router               |
| `vite-react-ssg/tanstack`                           | TanStack Router support (experimental)       |
| `vite-react-ssg/node`                               | Node.js/build-time utilities                 |
| `vite-react-ssg/style-collectors/styled-components` | styled-components support                    |

## CI Requirements

Before submitting changes, ensure:

1. `pnpm lint` passes with no errors
2. `pnpm typecheck` passes with no errors
3. `pnpm test` passes (builds examples then runs vitest)

The CI runs on Node 18.x and 20.x across Ubuntu, Windows, and macOS.
