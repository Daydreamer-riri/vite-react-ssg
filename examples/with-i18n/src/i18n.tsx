import type { i18n } from 'i18next'
import type { ReactNode } from 'react'
import { createInstance } from 'i18next'
import { useContext, useEffect, useRef } from 'react'
import { I18nContext, I18nextProvider } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import './@types/i18next.d.ts'

export const resources = {
  en: {
    translation: {
      hello: 'Hello',
      layout: {
        head: 'Layout',
        change_title: 'layout change title',
        change_lng: 'change language',
      },
      to: 'TO',
      edit: 'Edit',
      hmr: 'and save to test HMR',
      desc: 'Click on the Vite and React logos to learn more',
    },
  },
  zh: {
    translation: {
      hello: '你好',
      layout: {
        head: '布局',
        change_title: '更改标题',
        change_lng: '更改语言',
      },
      to: '跳转至',
      edit: '编辑',
      hmr: '并保存以测试HMR',
      desc: '点击 Vite 和 React 徽标了解更多信息',
    },
  },
} as const

export function I18n({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const currentLng = pathname.split('/')[1]
  const i18nRef = useRef<null | i18n>(null)
  if (!i18nRef.current) {
    i18nRef.current = createInstance({ lng: currentLng, defaultNS: 'translation', ns: ['translation'], resources })
    i18nRef.current.init()
  }

  return (
    <I18nextProvider i18n={i18nRef.current}>
      {children}
    </I18nextProvider>
  )
}

const lngs = Object.keys(resources)

export function useSyncLng() {
  const { pathname } = useLocation()
  const currentLng = pathname.split('/')[1]
  const { i18n } = useContext(I18nContext)

  const nav = useNavigate()
  useEffect(() => {
    if (!lngs.includes(currentLng)) {
      nav('/en')
      return
    }
    if (currentLng !== i18n.language) {
      i18n.changeLanguage(currentLng)
    }
  }, [nav, currentLng, i18n])
}

export function useI18n() {
  const nav = useNavigate()
  const { pathname, search } = useLocation()

  function withLngBase(path: string) {
    if (!path.startsWith('/')) {
      path = `/${path}`
    }
    if (path === '/') {
      path = ''
    }
    return `/${getLng()}${path}`
  }

  function getLng() {
    return pathname.split('/')[1]
  }

  const changeLng = (lng: keyof typeof resources) => {
    const originLng = getLng()
    nav({ pathname: pathname.replace(`/${originLng}`, `/${lng}`), search }, { replace: true })
  }

  const { i18n } = useContext(I18nContext)

  return {
    withLngBase,
    getLng,
    changeLng,
    i18n,
  }
}
