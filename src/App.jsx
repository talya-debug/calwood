import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react'
import { isOnboardingDone } from './utils/storage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewQuote from './pages/NewQuote'
import Quotes from './pages/Quotes'
import Clients from './pages/Clients'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'

function LoginBox() {
  return (
    <div className="w-full max-w-sm">
      <SignIn routing="hash" />
    </div>
  )
}

function App() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9faf5] p-6"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #e8f0e8 0%, #f9faf5 60%)' }}>
          <h1 className="text-5xl font-black text-[#144227] mb-3" style={{ fontFamily: 'Rubik' }}>CalWood</h1>
          <p className="text-xl font-bold text-[#2d5a3d] mb-1">הצעות מחיר חכמות לעבודות עץ</p>
          <p className="text-sm text-[#717971] mb-8">תחשב כמויות, תבנה הצעות, תחסוך זמן</p>
          <LoginBox />
          <div className="flex gap-3 mt-8">
            <div className="bg-[#2d5a3d]/10 text-[#2d5a3d] text-xs font-bold px-4 py-2 rounded-full">חישוב כמויות אוטומטי</div>
            <div className="bg-[#fdce6c]/30 text-[#7a5900] text-xs font-bold px-4 py-2 rounded-full">הפקת הצעות PDF</div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {!isOnboardingDone() ? (
          <Onboarding />
        ) : (
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="new-quote" element={<NewQuote />} />
              <Route path="quotes" element={<Quotes />} />
              <Route path="clients" element={<Clients />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </SignedIn>
    </>
  )
}

export default App
