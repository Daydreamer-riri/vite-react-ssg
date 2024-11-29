import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import './layout.css'
import { useTranslation } from 'react-i18next'
import { I18n, useI18n, useSyncLng } from './i18n'

export default function Layout() {
  return (
    <I18n>
      <LayoutContent />
    </I18n>
  )
}

function LayoutContent() {
  useSyncLng()
  const [state, setState] = useState(false)
  const { changeLng, getLng } = useI18n()
  const { t } = useTranslation()

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/react.svg" />
        <title>head test {state ? 'A' : 'B'}</title>
        <body className={`body-class-in-head-${state ? 'a' : 'b'}`} />
      </Head>
      <main>
        <h1 className="layout">{t('layout.head')}</h1>
        <Suspense>
          <Outlet />
        </Suspense>
        <div style={{ flexDirection: 'column', display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setState(v => !v)}>{t('layout.change_title')}</button>
          <button type="button" onClick={() => changeLng(getLng() === 'zh' ? 'en' : 'zh')}>{t('layout.change_lng')}</button>
        </div>
      </main>
    </>
  )
}
