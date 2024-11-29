import { lazy } from 'react'
import { ClientOnly, Link } from 'vite-react-ssg'
import './a.css'
import { useTranslation } from 'react-i18next'
import { useI18n } from '../i18n'

const ACount = lazy(() => import('../components/a-count'))

export default function A() {
  const { withLngBase } = useI18n()
  const { t } = useTranslation()
  return (
    <>
      <h1 className="a">{t('hello')} Page A</h1>
      <Link to={withLngBase('/')}>to index</Link>
      <ACount />
      <ClientOnly>
        {() => {
          return <div>{window.location.href}</div>
        }}
      </ClientOnly>
    </>
  )
}

export const Component = A

export const entry = 'src/pages/a.tsx'
