'use client'
import React from 'react'
// src/components/form/SecaoDadosGerais.tsx
import { useState } from 'react'
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

const ORDEM_POSTO: Record<string, number> = {
  'CEL': 1, 'TC': 2, 'MAJ': 3, 'CAP': 4,
  '1º TEN': 5, '2º TEN': 6, 'SUB TEN': 7, 'SUBTEN': 7,
  '1º SGT': 8, '1ºSGT': 8, '1ºSGT QPR': 8,
  '2º SGT': 9, '2ºSGT': 9,
  '3º SGT': 10, '3ºSGT': 10, '3º SGT QPR': 10,
  'CB': 11, 'SD': 12
}

function getOrdem(posto: string): number {
  if (!posto) return 99
  const up = posto.toUpperCase().trim()
  for (const key of Object.keys(ORDEM_POSTO)) {
    if (up.includes(key.toUpperCase())) return ORDEM_POSTO[key]
  }
  return 99
}


// Componente interno para coordenadas — mantém texto livre durante digitação
function CoordInput({ value, onChange, placeholder, hasError }: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder: string
  hasError: boolean
}) {
  const [texto, setTexto] = React.useState(value != null ? String(value) : '')

  React.useEffect(() => {
    if (value != null && !isNaN(value)) {
      setTexto(String(value))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    // Permite: dígitos, ponto, vírgula, sinal de menos
    const filtrado = v.replace(/[^0-9.,-]/g, '')
    setTexto(filtrado)
    const num = parseFloat(filtrado.replace(',', '.'))
    onChange(isNaN(num) ? undefined : num)
  }

  return (
    <input
      type="text"
      value={texto}
      onChange={handleChange}
      className={`input-field font-mono ${hasError ? 'error' : ''}`}
      placeholder={placeholder}
      inputMode="decimal"
    />
  )
}

export default function SecaoDadosGerais({ dados, militares, alvos, onChange, erros }: Props) {
  // Ordenar militares por posto
  const militaresOrdenados = [...militares]
    .filter(m => m.ativo)
    .sort((a, b) => getOrdem(a.posto_graduacao) - getOrdem(b.posto_graduacao))

  const toggleMilitar = (m: Militar) => {
    const ids = dados.equipe_ids || []
    const nomes = dados.equipe_nomes || []
    const postos = (dados as any).equipe_postos || []
    const npms = (dados as any).equipe_npms || []

    if (ids.includes(m.id)) {
      const idx = ids.indexOf(m.id)
      onChange('equipe_ids', ids.filter((_, i) => i !== idx))
      onChange('equipe_nomes', nomes.filter((_, i) => i !== idx))
      onChange('equipe_postos' as keyof Fiscalizacao, postos.filter((_: unknown, i: number) => i !== idx))
      onChange('equipe_npms' as keyof Fiscalizacao, npms.filter((_: unknown, i: number) => i !== idx))
    } else {
      onChange('equipe_ids', [...ids, m.id])
      onChange('equipe_nomes', [...nomes, m.nome_completo])
      onChange('equipe_postos' as keyof Fiscalizacao, [...postos, m.posto_graduacao])
      onChange('equipe_npms' as keyof Fiscalizacao, [...npms, m.matricula])
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
          <div className="border border-gray-300 rounded-lg max-h-56 overflow-y-auto">
            {militaresOrdenados.length === 0 ? (
              <p className="text-gray-400 text-sm p-3">Carregando militares...</p>
            ) : (
              militaresOrdenados.map(m => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors
                    ${(dados.equipe_ids || []).includes(m.id) ? 'bg-pmmg-green-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={(dados.equipe_ids || []).includes(m.id)}
                    onChange={() => toggleMilitar(m)}
                    className="rounded text-pmmg-green-600 focus:ring-pmmg-green-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.nome_completo}</p>
                    <p className="text-xs text-gray-500">
                      Nº {m.matricula} · {m.posto_graduacao} · {m.unidade}
                    </p>
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
            <Target className="inline w-4 h-4 mr-1" />
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
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </div>

        {/* Município + Hora */}
        <div className="field-group">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 label-required">
              <MapPin className="inline w-4 h-4 mr-1" />
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
              <Clock className="inline w-4 h-4 mr-1" />
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
            <CoordInput
              value={dados.coordenadas_lat}
              onChange={v => onChange('coordenadas_lat', v)}
              placeholder="-21.123456"
              hasError={!!erros.coordenadas}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <CoordInput
              value={dados.coordenadas_lng}
              onChange={v => onChange('coordenadas_lng', v)}
              placeholder="-44.123456"
              hasError={!!erros.coordenadas}
            />
          </div>
        </div>
        {erros.coordenadas && <p className="text-red-500 text-xs -mt-3">{erros.coordenadas}</p>}
      </div>
    </div>
  )
}
