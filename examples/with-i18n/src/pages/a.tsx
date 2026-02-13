import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ClientOnly } from 'vite-react-ssg'
import { useI18n } from '../i18n'
import './a.css'

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
