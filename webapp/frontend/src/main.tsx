import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { useAuth } from './store/auth'
import App from './App.tsx'
import './index.css'

function Shell() {
  // Restore auth dari localStorage saat app pertama load.
  const restore = useAuth((s) => s.restore)
  restore()

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  </StrictMode>,
)
