import { Outlet, NavLink } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { LayoutDashboard, FileText, Users, Settings, Plus, HelpCircle } from 'lucide-react'

// סדר מימין לשמאל כמו בסטיץ'
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'דאשבורד', end: true },
  { to: '/quotes', icon: FileText, label: 'הצעות' },
  { to: '/new-quote', icon: Plus, label: 'חדש', isCenter: true },
  { to: '/clients', icon: Users, label: 'לקוחות' },
  { to: '/settings', icon: Settings, label: 'הגדרות' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#f9faf5]">
      {/* Header — full width */}
      <header className="bg-[#FDFCF8] flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40 border-b border-[#E8E4DB]">
        <button className="text-[#2D5A3D] hover:bg-stone-100 rounded-full p-2">
          <HelpCircle size={22} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#2D5A3D] tracking-tight">CalWood</h1>
          <span className="text-[#2D5A3D]/40">→</span>
        </div>
      </header>

      {/* תוכן — 640px כמו סטיץ', ממורכז */}
      <main className="max-w-[640px] lg:max-w-[900px] xl:max-w-[1100px] mx-auto px-6 pt-4 pb-32 space-y-8">
        <Outlet />
      </main>

      {/* ניווט תחתון — full width, לפי סטיץ' */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-around items-center px-4 pt-3 pb-6 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-[#E8E4DB]">
        {navItems.map(({ to, icon: Icon, label, isCenter, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => {
              if (isCenter) return 'flex flex-col items-center'
              return `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-150
                ${isActive ? 'bg-[#2D5A3D]/10 text-[#2D5A3D]' : 'text-stone-500 hover:bg-stone-100/50'}`
            }}
          >
            {({ isActive }) => {
              if (navItems.find(n => n.to === to)?.isCenter) {
                return <Plus size={32} className="text-[#2D5A3D]" />
              }
              return (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                  <span className="text-[10px] font-bold tracking-wider">{label}</span>
                </>
              )
            }}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
