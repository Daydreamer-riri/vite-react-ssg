import { describe, expect, it, vi } from 'vitest'
import { deserializeState, serializeState } from '../../src/utils/state'

describe('serializeState', () => {
  it('returns null for null input', () => {
    expect(serializeState(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(serializeState(undefined)).toBeNull()
  })

  it('returns null for empty object', () => {
    expect(serializeState({})).toBeNull()
  })

  it('double-encodes the state so it is safe to embed in a script tag', () => {
    const out = serializeState({ a: 1 })
    expect(typeof out).toBe('string')
    // outer stringify wraps inner JSON in quotes
    expect(out!.startsWith('"')).toBe(true)
    expect(out!.endsWith('"')).toBe(true)
    // inner JSON should survive round-trip
    const inner = JSON.parse(out!) as string
    expect(JSON.parse(inner)).toEqual({ a: 1 })
  })

  it('escapes XSS-unsafe characters in the serialized output', () => {
    const out = serializeState({ html: '</script><script>alert(1)</script>' })!
    // the raw serialized string must never contain `<`, `>`, or `/`
    // so it is safe to embed inside a <script> tag
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(out).not.toContain('/')
    expect(out).toContain('\\u003C')
    expect(out).toContain('\\u003E')
    expect(out).toContain('\\u002F')
  })

  it('escapes U+2028 and U+2029 line separators', () => {
    const out = serializeState({ s: '  ' })!
    expect(out).not.toContain(' ')
    expect(out).not.toContain(' ')
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
  })

  it('returns null and logs when serialization throws', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(serializeState(circular)).toBeNull()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('deserializeState', () => {
  it('returns {} for empty input', () => {
    expect(deserializeState('')).toEqual({})
  })

  it('parses a JSON string', () => {
    expect(deserializeState('{"a":1}')).toEqual({ a: 1 })
  })

  it('returns {} and logs on invalid JSON', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(deserializeState('not json')).toEqual({})
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('round-trips with serializeState', () => {
    const state = { a: 1, b: { c: '</x>' } }
    const serialized = serializeState(state)!
    // simulate the browser `window.__INITIAL_STATE__ = <serialized>` step
    const inBrowserValue = JSON.parse(serialized) as string
    expect(deserializeState(inBrowserValue)).toEqual(state)
  })
})
