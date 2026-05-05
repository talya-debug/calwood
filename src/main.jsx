import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { heIL } from '@clerk/localizations'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkKey}
      localization={heIL}
      appearance={{
        layout: { direction: 'rtl' },
        variables: {
          colorPrimary: '#2d5a3d',
          colorText: '#1a1c1a',
          colorTextSecondary: '#717971',
          colorBackground: '#ffffff',
          borderRadius: '12px',
          fontFamily: 'Rubik, system-ui, sans-serif',
        },
        elements: {
          card: { boxShadow: 'none', border: 'none' },
          headerTitle: { display: 'none' },
          headerSubtitle: { display: 'none' },
          footer: { display: 'none' },
          formButtonPrimary: {
            backgroundColor: '#2d5a3d',
            borderRadius: '12px',
            height: '48px',
            fontSize: '16px',
            fontWeight: '700',
          },
          socialButtonsBlockButton: {
            borderRadius: '12px',
            height: '48px',
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
