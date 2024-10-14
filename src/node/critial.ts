import type { CrittersOptions } from '../types'

export async function getCritters(outDir: string, options: CrittersOptions = {}): Promise<any | undefined> {
  try {
    // @ts-expect-error type lost
    const CrittersClass = (await import('critters')).default

    return new CrittersClass({
      path: outDir,
      logLevel: 'warn',
      external: true,
      inlineFonts: true,
      preloadFonts: true,
      ...options,
    })
  }
  catch (e) {
    return undefined
  }
}
