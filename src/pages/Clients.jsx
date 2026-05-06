import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getClients, saveClient, deleteClient, getQuotes, saveClientAndSync, deleteClientAndSync } from '../utils/storage'
import { Plus, Trash2, Search, Phone, MapPin, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react'

const typeNames = { pergola: 'פרגולה', deck: 'דק' }

function ClientCard({ client, handleDelete }) {
  const [expanded, setExpanded] = useState(false)
  const clientQuotes = getQuotes().filter(q => q.client?.name === client.name)
  const fmt = (n) => Number(n || 0).toLocaleString('he-IL')

  return (
    <div className="bg-white rounded-2xl border border-[#e7e9e4] p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1">
          {clientQuotes.length > 0 && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#bceec8]/30 text-[#144227] font-bold flex items-center gap-1">
              {clientQuotes.length} הצעות
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
        <div className="text-right flex items-center gap-2">
          <div className="w-9 h-9 bg-[#edeeea] rounded-full flex items-center justify-center text-[#717971] text-sm font-bold">
            {client.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-[#1a1c1a] text-lg">{client.name}</h3>
            {client.city && <p className="text-xs text-[#717971] flex items-center gap-1 justify-end"><MapPin size={11} /> {client.city}</p>}
          </div>
        </div>
      </div>

      {/* הצעות של הלקוח */}
      {expanded && clientQuotes.length > 0 && (
        <div className="bg-[#f3f4ef] rounded-xl p-3 mb-3 space-y-2">
          {clientQuotes.map(q => {
            const dims = q.dimensions || {}
            const date = q.created_at ? new Date(q.created_at).toLocaleDateString('he-IL') : ''
            return (
              <div key={q.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                <span className="text-[#717971] flex items-center gap-1 text-xs"><Calendar size={12} /> {date}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#2d5a3d]">{fmt(q.result?.totals?.total)}₪</span>
                  <span className="text-[#414942]">{typeNames[q.type]} {dims.width && dims.length ? `${dims.length}x${dims.width}` : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {client.phone && (
        <a href={`tel:${client.phone}`} className="block w-full py-2.5 bg-[#f3f4ef] rounded-xl text-center text-sm text-[#2d5a3d] font-medium mb-2">
          <Phone size={14} className="inline-block ml-1" /> {client.phone}
        </a>
      )}

      <div className="flex gap-2">
        <Link to="/new-quote" className="flex-1 py-2.5 bg-[#fdce6c] text-[#7a5900] rounded-xl text-sm font-bold text-center flex items-center justify-center gap-1 hover:brightness-105">
          <Plus size={14} /> הצעה חדשה
        </Link>
        <button onClick={() => handleDelete(client.id)} className="px-3 py-2.5 border border-red-200 text-red-400 rounded-xl hover:bg-red-50">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState(getClients)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', city: '' })

  const filtered = clients.filter(c => !search || c.name.includes(search) || (c.phone || '').includes(search))

  const handleSave = () => {
    if (!form.name.trim()) return
    saveClient({ ...form }); saveClientAndSync(form); setClients(getClients())
    setForm({ name: '', phone: '', city: '' }); setShowForm(false)
  }

  const handleDelete = (id) => { deleteClientAndSync(id); setClients(getClients()) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm bg-[#2d5a3d] text-white px-4 py-2.5 rounded-2xl font-bold">
          <Plus size={16} /> לקוח חדש
        </button>
        <h2 className="text-2xl font-extrabold text-[#1a1c1a]">לקוחות</h2>
      </div>

      <div className="relative">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717971]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לקוח..."
          className="w-full h-12 pr-11 pl-4 border border-[#c1c9c0] rounded-2xl bg-white text-sm focus:border-[#2d5a3d] focus:border-2 outline-none" />
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#c1c9c0] p-5 space-y-3">
          <div className="flex justify-between items-center">
            <button onClick={() => setShowForm(false)} className="text-[#717971]"><X size={18} /></button>
            <h3 className="text-base font-bold">הוספה מהירה</h3>
          </div>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="שם מלא" className="w-full h-12 px-4 border border-[#c1c9c0] rounded-xl focus:border-[#2d5a3d] outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="טלפון" className="h-12 px-4 border border-[#c1c9c0] rounded-xl focus:border-[#2d5a3d] outline-none" />
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="עיר" className="h-12 px-4 border border-[#c1c9c0] rounded-xl focus:border-[#2d5a3d] outline-none" />
          </div>
          <button onClick={handleSave} className="w-full py-3 bg-[#2d5a3d] text-white font-bold rounded-xl">שמור לקוח</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e7e9e4] p-10 text-center">
          <p className="text-[#414942] font-medium">{clients.length === 0 ? 'עדיין אין לקוחות' : 'לא נמצאו'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => <ClientCard key={c.id} client={c} handleDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}
