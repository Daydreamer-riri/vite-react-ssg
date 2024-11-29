import { useState } from 'react'
import { Link } from 'vite-react-ssg'
import { useTranslation } from 'react-i18next'
import reactLogo from '../assets/react.svg'
import { useI18n } from '../i18n'

// import { Link, useNavigate } from 'react-router-dom'

export default function Index() {
  const [count, setCount] = useState(0)
  const { t } = useTranslation()
  const { withLngBase } = useI18n()

  return (
    <>
      <div>
        <img src={reactLogo} />
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button type="button" onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <Link to={withLngBase('/a')}>{t('to')} A</Link>
        <p>
          {t('edit')} <code>src/App.tsx</code> {t('hmr')}
        </p>
      </div>
      <p className="read-the-docs">
        {t('desc')}
      </p>
    </>
  )
}
