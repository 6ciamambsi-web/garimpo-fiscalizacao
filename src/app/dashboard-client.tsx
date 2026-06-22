'use client'
// src/app/page.tsx — Dashboard principal
import { useState } from 'react'
import type { Fiscalizacao, Usuario } from '@/types'

// Lazy-load dos componentes pesados
import dynamic from 'next/dynamic'
const FiscalizacoesList = dynamic(() => import('@/components/FiscalizacoesList'), { ssr: false })
const FiscalizacaoForm = dynamic(() => import('@/components/FiscalizacaoForm'), { ssr: false })
const FiscalizacaoDetalhe = dynamic(() => import('@/components/FiscalizacaoDetalhe'), { ssr: false })
import Navbar from '@/components/Navbar'

// Este é o wrapper client — o Server Component real está em app/page-server.tsx
export default function DashboardClient({ usuario }: { usuario: Usuario }) {
  const [view, setView] = useState<'lista' | 'form' | 'detalhe'>('lista')
  const [selecionada, setSelecionada] = useState<Fiscalizacao | undefined>()

  const handleNova = () => { setSelecionada(undefined); setView('form') }
  const handleEditar = (f: Fiscalizacao) => { setSelecionada(f); setView('form') }
  const handleVisualizar = (f: Fiscalizacao) => { setSelecionada(f); setView('detalhe') }
  const handleVoltar = () => { setSelecionada(undefined); setView('lista') }
  const handleSalvo = () => { setSelecionada(undefined); setView('lista') }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar usuario={usuario} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'lista' && (
          <FiscalizacoesList
            usuario={usuario}
            onNova={handleNova}
            onEditar={handleEditar}
            onVisualizar={handleVisualizar}
          />
        )}
        {view === 'form' && (
          <FiscalizacaoForm
            fiscalizacao={selecionada}
            usuario={usuario}
            onSalvo={handleSalvo}
            onCancelar={handleVoltar}
          />
        )}
        {view === 'detalhe' && selecionada && (
          <FiscalizacaoDetalhe
            fiscalizacao={selecionada}
            usuario={usuario}
            onFechar={handleVoltar}
            onEditar={() => handleEditar(selecionada)}
          />
        )}
      </main>
    </div>
  )
}
