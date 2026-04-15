import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '14px 20px',
          fontSize: '0.9rem',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: '500',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          maxWidth: '420px',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#0f172a' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
        },
      }}
    />
  </StrictMode>,
)

