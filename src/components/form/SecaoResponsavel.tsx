'use client'
// src/components/form/SecaoResponsavel.tsx
import { User, Plus, Trash2 } from 'lucide-react'
import type { Fiscalizacao } from '@/types'
import { maskCPF, maskPhone } from '@/lib/masks'

interface Props {
  dados: Partial<Fiscalizacao>
  onChange: (field: keyof Fiscalizacao, value: unknown) => void
  erros: Record<string, string>
}

export default function SecaoResponsavel({ dados, onChange, erros }: Props) {
  const telefones = dados.responsavel_principal_telefones || ['']

  const addTelefone = () => onChange('responsavel_principal_telefones', [...telefones, ''])
  const removeTelefone = (i: number) =>
    onChange('responsavel_principal_telefones', telefones.filter((_, idx) => idx !== i))
  const updateTelefone = (i: number, v: string) => {
    const novo = [...telefones]
    novo[i] = maskPhone(v)
    onChange('responsavel_principal_telefones', novo)
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <User className="w-4 h-4" />
        2. Responsável pelo Estabelecimento
      </div>
      <div className="p-5 space-y-4">

        {/* Responsável local */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Responsável pela Exploração no Local
          </label>
          <input
            type="text"
            value={dados.responsavel_local || ''}
            onChange={e => onChange('responsavel_local', e.target.value)}
            className="input-field"
            placeholder="Nome da pessoa presente no momento da abordagem"
          />
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-600 mb-3">Responsável Principal / Proprietário</p>

          <div className="field-group">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={dados.responsavel_principal_nome || ''}
                onChange={e => onChange('responsavel_principal_nome', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="field-group mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                value={dados.responsavel_principal_cpf || ''}
                onChange={e => onChange('responsavel_principal_cpf', maskCPF(e.target.value))}
                className={`input-field font-mono ${erros.cpf_responsavel ? 'error' : ''}`}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {erros.cpf_responsavel && <p className="text-red-500 text-xs mt-1">{erros.cpf_responsavel}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
              <input
                type="text"
                value={dados.responsavel_principal_rg || ''}
                onChange={e => onChange('responsavel_principal_rg', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              type="text"
              value={dados.responsavel_principal_endereco || ''}
              onChange={e => onChange('responsavel_principal_endereco', e.target.value)}
              className="input-field"
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>

          {/* Telefones */}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone(s)</label>
            <div className="space-y-2">
              {telefones.map((tel, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={tel}
                    onChange={e => updateTelefone(i, e.target.value)}
                    className="input-field flex-1"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                  {telefones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTelefone(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTelefone}
              className="mt-2 text-sm text-pmmg-green-700 hover:text-pmmg-green-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Adicionar telefone
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
