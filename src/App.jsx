import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewQuote from './pages/NewQuote'
import Quotes from './pages/Quotes'
import Clients from './pages/Clients'
import Settings from './pages/Settings'

function App() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9faf5] p-6"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #e8f0e8 0%, #f9faf5 60%)' }}>
          {/* לוגו */}
          <h1 className="text-5xl font-black text-[#144227] mb-3" style={{ fontFamily: 'Rubik' }}>CalWood</h1>
          <p className="text-xl font-bold text-[#2d5a3d] mb-1">הצעות מחיר חכמות לעבודות עץ</p>
          <p className="text-sm text-[#717971] mb-8">תחשב כמויות, תבנה הצעות, תחסוך זמן</p>

          {/* כרטיס כניסה */}
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-[#1a1c1a] text-center mb-2">כניסה למערכת</h2>
            <p className="text-sm text-[#717971] text-center mb-6">התחבר כדי לנהל את הפרויקטים שלך</p>
            <SignIn routing="hash" />
          </div>

          {/* באדג'ים */}
          <div className="flex gap-3 mt-8">
            <div className="bg-[#2d5a3d]/10 text-[#2d5a3d] text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5">
              חישוב כמויות אוטומטי
            </div>
            <div className="bg-[#fdce6c]/30 text-[#7a5900] text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5">
              הפקת הצעות PDF
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
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
      </SignedIn>
    </>
  )
}

export default App
