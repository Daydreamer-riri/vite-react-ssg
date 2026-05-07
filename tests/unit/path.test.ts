import { describe, expect, it } from 'vitest'
import {
  joinUrlSegments,
  removeLeadingSlash,
  stripBase,
  withLeadingSlash,
  withTrailingSlash,
} from '../../src/utils/path'

describe('joinUrlSegments', () => {
  it('returns b when a is empty', () => {
    expect(joinUrlSegments('', '/foo')).toBe('/foo')
  })

  it('returns a when b is empty', () => {
    expect(joinUrlSegments('/foo', '')).toBe('/foo')
  })

  it('returns empty string when both are empty', () => {
    expect(joinUrlSegments('', '')).toBe('')
  })

  it('strips a trailing slash from a before joining', () => {
    expect(joinUrlSegments('/foo/', '/bar')).toBe('/foo/bar')
  })

  it('adds a leading slash to b when missing', () => {
    expect(joinUrlSegments('/foo', 'bar')).toBe('/foo/bar')
  })

  it('does not double up slashes', () => {
    expect(joinUrlSegments('/foo/', 'bar')).toBe('/foo/bar')
  })
})

describe('removeLeadingSlash', () => {
  it('removes a single leading slash', () => {
    expect(removeLeadingSlash('/foo')).toBe('foo')
  })

  it('leaves strings without a leading slash unchanged', () => {
    expect(removeLeadingSlash('foo')).toBe('foo')
  })

  it('handles empty input', () => {
    expect(removeLeadingSlash('')).toBe('')
  })
})

describe('withLeadingSlash', () => {
  it('prepends a slash when missing', () => {
    expect(withLeadingSlash('foo')).toBe('/foo')
  })

  it('keeps existing leading slash', () => {
    expect(withLeadingSlash('/foo')).toBe('/foo')
  })
})

describe('withTrailingSlash', () => {
  it('appends a slash when missing', () => {
    expect(withTrailingSlash('/foo')).toBe('/foo/')
  })

  it('keeps existing trailing slash', () => {
    expect(withTrailingSlash('/foo/')).toBe('/foo/')
  })
})

describe('stripBase', () => {
  it('returns / when path equals base', () => {
    expect(stripBase('/app', '/app')).toBe('/')
  })

  it('strips the base prefix preserving the leading slash', () => {
    expect(stripBase('/app/foo', '/app')).toBe('/foo')
  })

  it('handles base already ending with a slash', () => {
    expect(stripBase('/app/foo', '/app/')).toBe('/foo')
  })

  it('returns the path unchanged when base does not match', () => {
    expect(stripBase('/bar', '/app')).toBe('/bar')
  })
})
