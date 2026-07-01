import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.scss'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Radial bracket is now the main page. */}
        <Route path="/" element={<App variant="rounded" />} />
        <Route path="/rounded-bracket" element={<App variant="rounded" />} />
        {/* Classic linear bracket. */}
        <Route path="/bracket" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
