import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'sonner'   // ⬅️ إضافة

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* ⬇️ Toaster عام للاب بالكامل */}
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-slate-200 shadow-lg',
          title: 'text-slate-800',
          description: 'text-slate-500',
          success: 'bg-emerald-50',
          error: 'bg-red-50',
          info: 'bg-white',
        },
      }}
    />
  </StrictMode>,
)
