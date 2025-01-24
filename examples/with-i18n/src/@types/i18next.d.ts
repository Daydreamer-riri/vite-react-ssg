import type { resources } from '../i18n'
import 'i18next'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: typeof resources['en']
  }
}
