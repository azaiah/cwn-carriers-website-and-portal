import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-500.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow/latin-700.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/barlow-condensed/latin-800-italic.css'
import '@fontsource/exo-2/latin-800-italic.css'
import '@fontsource/exo-2/latin-900-italic.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import './index.css'
import SiteLayout from './site/SiteLayout'
import Home from './site/Home'
import Services from './site/Services'
import Shippers from './site/Shippers'
import Brokers from './site/Brokers'
import Drive from './site/Drive'
import About from './site/About'
import Contact from './site/Contact'

const Portal = lazy(() => import('./portal/Portal'))
const Router = import.meta.env.MODE === 'preview' ? HashRouter : BrowserRouter

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <ScrollTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="shippers" element={<Shippers />} />
          <Route path="brokers" element={<Brokers />} />
          <Route path="drive" element={<Drive />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
        </Route>
        <Route path="portal/*" element={<Suspense fallback={<div className="min-h-screen tex-asphalt" />}><Portal /></Suspense>} />
      </Routes>
    </Router>
  </StrictMode>,
)
