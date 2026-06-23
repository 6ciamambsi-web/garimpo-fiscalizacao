'use client'
// src/components/Navbar.tsx
import { useState } from 'react'
import { Shield, LogOut, User, ChevronDown, Menu, X, Settings } from 'lucide-react'
import type { Usuario } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavbarProps { usuario: Usuario }

export default function Navbar({ usuario }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const nomeExibir = usuario.nome || `Nº ${usuario.npm}`
  const perfilLabel = usuario.perfil === 'admin' ? '⭐ Admin' : 'Operacional'

  return (
    <header className="bg-pmmg-green-800 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-pmmg-gold-400" />
          <div>
            <span className="text-white font-bold text-sm hidden sm:block">5ª CIA PM MAmb</span>
            <span className="text-pmmg-green-300 text-xs hidden sm:block">Fiscalização de Garimpo/Draga</span>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2 relative">
          {usuario.perfil === 'admin' && (
            <button onClick={() => router.push('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-pmmg-gold-300 hover:text-white hover:bg-pmmg-green-700 rounded-lg transition-colors text-sm">
              <Settings className="w-4 h-4" />
              Usuários
            </button>
          )}
          <button onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-pmmg-green-700 transition-colors">
            <div className="w-7 h-7 rounded-full bg-pmmg-green-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium leading-tight">{nomeExibir}</p>
              <p className="text-pmmg-green-300 text-xs leading-tight">
                {perfilLabel} · Nº {usuario.npm}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-pmmg-green-300 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-700">{nomeExibir}</p>
                <p className="text-xs text-gray-500">{usuario.posto_graduacao} · Nº {usuario.npm}</p>
                <p className="text-xs text-gray-500">{usuario.unidade}</p>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </button>
            </div>
          )}
        </div>

        {/* Mobile */}
        <button className="md:hidden p-2 text-white" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-pmmg-green-900 border-t border-pmmg-green-700 px-4 py-3">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-pmmg-green-700">
            <div className="w-8 h-8 rounded-full bg-pmmg-green-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{nomeExibir}</p>
              <p className="text-pmmg-green-300 text-xs">{usuario.posto_graduacao} · Nº {usuario.npm} · {perfilLabel}</p>
            </div>
          </div>
          {usuario.perfil === 'admin' && (
            <button onClick={() => { router.push('/admin'); setMobileOpen(false) }}
              className="flex items-center gap-2 text-pmmg-gold-300 text-sm mb-3">
              <Settings className="w-4 h-4" />Gestão de Usuários
            </button>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-sm">
            <LogOut className="w-4 h-4" />Sair do Sistema
          </button>
        </div>
      )}
    </header>
  )
}
