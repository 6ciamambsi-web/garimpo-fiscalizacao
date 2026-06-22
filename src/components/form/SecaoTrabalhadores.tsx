'use client'
// src/components/form/SecaoTrabalhadores.tsx
import { Users, Plus, Trash2 } from 'lucide-react'
import type { Fiscalizacao, Trabalhador } from '@/types'
import { maskCPF } from '@/lib/masks'

interface Props {
  dados: Partial<Fiscalizacao>
  onChange: (field: keyof Fiscalizacao, value: unknown) => void
}

const TRABALHADOR_VAZIO: Trabalhador = { nome_completo: '', cpf: '', funcao: '' }

export default function SecaoTrabalhadores({ dados, onChange }: Props) {
  const trabalhadores = dados.trabalhadores || []

  const add = () => onChange('trabalhadores', [...trabalhadores, { ...TRABALHADOR_VAZIO }])

  const remove = (i: number) =>
    onChange('trabalhadores', trabalhadores.filter((_, idx) => idx !== i))

  const update = (i: number, field: keyof Trabalhador, value: string) => {
    const novo = trabalhadores.map((t, idx) =>
      idx === i ? { ...t, [field]: field === 'cpf' ? maskCPF(value) : value } : t
    )
    onChange('trabalhadores', novo)
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <Users className="w-4 h-4" />
        3. Levantamento de Trabalhadores
      </div>
      <div className="p-5 space-y-5">
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pessoas Trabalhando no Momento da Abordagem
          </label>
          <input
            type="number"
            min="0"
            value={dados.qtd_trabalhadores ?? ''}
            onChange={e => onChange('qtd_trabalhadores', parseInt(e.target.value) || 0)}
            className="input-field"
            placeholder="0"
          />
        </div>

        {/* Tabela dinâmica */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Relação dos Trabalhadores</label>
            <button
              type="button"
              onClick={add}
              className="text-sm text-pmmg-green-700 hover:text-pmmg-green-800 flex items-center gap-1 border border-pmmg-green-300 rounded-lg px-3 py-1.5 hover:bg-pmmg-green-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>

          {trabalhadores.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum trabalhador adicionado</p>
              <button
                type="button"
                onClick={add}
                className="mt-2 text-sm text-pmmg-green-600 hover:underline"
              >
                Adicionar trabalhador
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="hidden md:grid md:grid-cols-[1fr_160px_180px_36px] gap-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Nome Completo</span>
                <span>CPF</span>
                <span>Função</span>
                <span></span>
              </div>

              {trabalhadores.map((t, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-[1fr_160px_180px_36px] gap-2 items-start bg-gray-50 p-3 md:p-0 md:bg-transparent rounded-lg md:rounded-none"
                >
                  <div>
                    <label className="md:hidden text-xs text-gray-500 mb-1 block">Nome</label>
                    <input
                      type="text"
                      value={t.nome_completo}
                      onChange={e => update(i, 'nome_completo', e.target.value)}
                      className="input-field"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="md:hidden text-xs text-gray-500 mb-1 block">CPF</label>
                    <input
                      type="text"
                      value={t.cpf}
                      onChange={e => update(i, 'cpf', e.target.value)}
                      className="input-field font-mono"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <label className="md:hidden text-xs text-gray-500 mb-1 block">Função</label>
                    <input
                      type="text"
                      value={t.funcao}
                      onChange={e => update(i, 'funcao', e.target.value)}
                      className="input-field"
                      placeholder="Ex: Mergulhador"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start md:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {trabalhadores.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">{trabalhadores.length} trabalhador(es) listado(s)</p>
          )}
        </div>
      </div>
    </div>
  )
}
