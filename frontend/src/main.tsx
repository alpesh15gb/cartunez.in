import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CartProvider } from './hooks/useCart'
import { AuthProvider } from './hooks/useAuth'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
)
