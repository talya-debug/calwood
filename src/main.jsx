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
          rootBox: { width: '100%' },
          card: { boxShadow: 'none', border: 'none', background: '#ffffff', padding: '0', margin: '0' },
          main: { gap: '12px' },
          headerTitle: { display: 'none' },
          headerSubtitle: { display: 'none' },
          footer: { display: 'none' },
          socialButtons: { gap: '8px' },
          socialButtonsBlockButton: { background: '#ffffff', border: '1px solid #E8E4DB', borderRadius: '12px', height: '48px' },
          formFieldInput: { background: '#ffffff', border: '1px solid #E8E4DB', borderRadius: '12px', height: '48px' },
          dividerLine: { background: '#E8E4DB' },
          dividerText: { color: '#717971' },
          formFieldLabel: { color: '#414942', fontWeight: '600' },
          identityPreview: { background: '#ffffff', border: '1px solid #E8E4DB', borderRadius: '12px' },
          alert: { borderRadius: '12px' },
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
