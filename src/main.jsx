import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
// Fonts are bundled with the app so they work offline and never flash.
// Cormorant Garamond sets the text, Inter the interface, Frank Ruhl Libre the Hebrew.
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-ext-400.css'
import '@fontsource/cormorant-garamond/latin-ext-400-italic.css'
import '@fontsource/inter/latin-200.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/frank-ruhl-libre/hebrew-400.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* "user" follows the reader's reduced-motion setting for every animation. */}
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <App />
      </HashRouter>
    </MotionConfig>
  </StrictMode>,
)
