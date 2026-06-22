'use client'
// src/components/form/SecaoDadosGerais.tsx
import { Users, MapPin, Clock, Target } from 'lucide-react'
import type { Fiscalizacao, Militar, Alvo } from '@/types'
import { maskCoord } from '@/lib/masks'

interface Props {
  dados: Partial<Fiscalizacao>
  militares: Militar[]
  alvos: Alvo[]
  onChange: (field: keyof Fiscalizacao, value: unknown) => void
  erros: Record<string, string>
}

export default function SecaoDadosGerais({ dados, militares, alvos, onChange, erros }: Props) {
  const toggleMilitar = (id: string) => {
    const atual = dados.equipe_ids || []
    const atualNomes = dados.equipe_nomes || []
    const militar = militares.find(m => m.id === id)
    if (atual.includes(id)) {
      onChange('equipe_ids', atual.filter(i => i !== id))
      onChange('equipe_nomes', atualNomes.filter(n => n !== militar?.nome_completo))
    } else {
      onChange('equipe_ids', [...atual, id])
      onChange('equipe_nomes', [...atualNomes, militar?.nome_completo || ''])
    }
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <Users className="w-4 h-4" />
        1. Dados Gerais
      </div>
      <div className="p-5 space-y-5">
        {/* Equipe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 label-required">
            Equipe Responsável
          </label>
          <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
            {militares.length === 0 ? (
              <p className="text-gray-400 text-sm p-3">Carregando militares...</p>
            ) : (
              militares.filter(m => m.ativo).map(m => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors
                    ${(dados.equipe_ids || []).includes(m.id) ? 'bg-pmmg-green-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={(dados.equipe_ids || []).includes(m.id)}
                    onChange={() => toggleMilitar(m.id)}
                    className="rounded text-pmmg-green-600 focus:ring-pmmg-green-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.nome_completo}</p>
                    <p className="text-xs text-gray-500">{m.matricula} · {m.funcao} · {m.unidade}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          {(dados.equipe_ids || []).length > 0 && (
            <p className="text-xs text-pmmg-green-600 mt-1">
              {(dados.equipe_ids || []).length} militar(es) selecionado(s)
            </p>
          )}
        </div>

        {/* Alvo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alvo Fiscalizado
          </label>
          <select
            value={dados.alvo_id || ''}
            onChange={e => {
              const alvo = alvos.find(a => a.id === e.target.value)
              onChange('alvo_id', e.target.value)
              onChange('alvo_nome', alvo?.nome || '')
            }}
            className="input-field"
          >
            <option value="">— Selecione o alvo —</option>
            {alvos.filter(a => a.ativo).map(a => (
              <option key={a.id} value={a.id}>
                {a.nome} {a.tipo ? `(${a.tipo})` : ''} {a.municipio ? `— ${a.municipio}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Município + Hora */}
        <div className="field-group">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 label-required">
              Município
            </label>
            <input
              type="text"
              value={dados.municipio || ''}
              onChange={e => onChange('municipio', e.target.value)}
              className={`input-field ${erros.municipio ? 'error' : ''}`}
              placeholder="Ex: Aiuruoca"
            />
            {erros.municipio && <p className="text-red-500 text-xs mt-1">{erros.municipio}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora da Abordagem
            </label>
            <input
              type="time"
              value={dados.hora_abordagem || ''}
              onChange={e => onChange('hora_abordagem', e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Coordenadas */}
        <div className="field-group">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="text"
              value={dados.coordenadas_lat?.toString() || ''}
              onChange={e => {
                const v = maskCoord(e.target.value)
                onChange('coordenadas_lat', v ? parseFloat(v) : undefined)
              }}
              className={`input-field font-mono ${erros.coordenadas ? 'error' : ''}`}
              placeholder="-21.123456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="text"
              value={dados.coordenadas_lng?.toString() || ''}
              onChange={e => {
                const v = maskCoord(e.target.value)
                onChange('coordenadas_lng', v ? parseFloat(v) : undefined)
              }}
              className={`input-field font-mono ${erros.coordenadas ? 'error' : ''}`}
              placeholder="-44.123456"
            />
          </div>
        </div>
        {erros.coordenadas && <p className="text-red-500 text-xs -mt-3">{erros.coordenadas}</p>}
      </div>
    </div>
  )
}
