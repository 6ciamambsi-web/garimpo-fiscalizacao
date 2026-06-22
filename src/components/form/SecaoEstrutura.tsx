'use client'
// src/components/form/SecaoEstrutura.tsx
import { Anchor } from 'lucide-react'
import type { Fiscalizacao } from '@/types'

interface Props {
  dados: Partial<Fiscalizacao>
  onChange: (field: keyof Fiscalizacao, value: unknown) => void
}

const ITENS = [
  { field: 'qtd_balsa_draga', label: 'Balsas / Dragas', icon: '⚓' },
  { field: 'qtd_motores', label: 'Motores', icon: '⚙️' },
  { field: 'qtd_bombas_succao', label: 'Bombas de Sucção', icon: '🔧' },
  { field: 'qtd_compressores', label: 'Compressores', icon: '💨' },
  { field: 'qtd_geradores', label: 'Geradores', icon: '⚡' },
  { field: 'qtd_embarcacoes_apoio', label: 'Embarcações de Apoio', icon: '🚤' },
  { field: 'qtd_roupas_mergulho', label: 'Roupas de Mergulho', icon: '🤿' },
  { field: 'qtd_mascaras_mergulho', label: 'Máscaras de Mergulho', icon: '😷' },
  { field: 'qtd_bateias', label: 'Bateias', icon: '🪣' },
  { field: 'qtd_respiradores', label: 'Respiradores', icon: '🫁' },
  { field: 'qtd_balancas', label: 'Balanças', icon: '⚖️' },
  { field: 'qtd_frascos_mercurio', label: 'Frascos de Mercúrio', icon: '⚗️' }
] as const

type EstruturaField = typeof ITENS[number]['field']

export default function SecaoEstrutura({ dados, onChange }: Props) {
  return (
    <div className="section-card">
      <div className="section-header">
        <Anchor className="w-4 h-4" />
        4. Estrutura Operacional
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ITENS.map(item => (
            <div key={item.field} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-lg mb-1">{item.icon}</div>
              <label className="block text-xs text-gray-600 mb-1 leading-tight">{item.label}</label>
              <input
                type="number"
                min="0"
                value={(dados[item.field as keyof Fiscalizacao] as number) ?? ''}
                onChange={e => onChange(item.field as keyof Fiscalizacao, parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-center text-lg font-bold text-pmmg-green-700 focus:outline-none focus:ring-2 focus:ring-pmmg-green-400"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
