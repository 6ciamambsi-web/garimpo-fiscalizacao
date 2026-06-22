'use client'
// src/components/form/SecaoCaracteristicas.tsx
import { Settings, FileText } from 'lucide-react'
import type { Fiscalizacao, MetodoGarimpo, TituloMinerario } from '@/types'

interface Props {
  dados: Partial<Fiscalizacao>
  onChange: (field: keyof Fiscalizacao, value: unknown) => void
}

const METODOS: { value: MetodoGarimpo; label: string }[] = [
  { value: 'dragagem_aiuruoca', label: 'Lavra em aluvião por dragagem no leito do Rio Aiuruoca' },
  { value: 'dragagem_verde', label: 'Lavra em aluvião por dragagem no leito do Rio Verde' },
  { value: 'dragagem_baependi', label: 'Lavra em aluvião por dragagem no leito do Rio Baependi' },
  { value: 'dragagem_acumulo', label: 'Lavra em aluvião por dragagem em área de acúmulo de água às margens do curso d\'água' },
  { value: 'outro', label: 'Outro' }
]

const TITULOS: { value: TituloMinerario; label: string }[] = [
  { value: 'clandestino', label: 'Clandestino' },
  { value: 'portaria_lavra', label: 'Portaria de Lavra' },
  { value: 'permissao_lavra', label: 'Permissão de Lavra Garimpeira' },
  { value: 'licenciamento', label: 'Licenciamento' },
  { value: 'registro_extracao', label: 'Registro de Extração' },
  { value: 'alvara_pesquisa', label: 'Alvará de Pesquisa' },
  { value: 'outro', label: 'Outro' }
]

export default function SecaoCaracteristicas({ dados, onChange }: Props) {
  return (
    <div className="space-y-5">
      {/* Características Operacionais */}
      <div className="section-card">
        <div className="section-header">
          <Settings className="w-4 h-4" />
          5. Características Operacionais
        </div>
        <div className="p-5 space-y-4">
          <div className="field-group">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Funcionamento</label>
              <input
                type="text"
                value={dados.horario_funcionamento || ''}
                onChange={e => onChange('horario_funcionamento', e.target.value)}
                className="input-field"
                placeholder="Ex: 06h às 18h"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dias de Operação por Semana</label>
              <input
                type="number"
                min="1"
                max="7"
                value={dados.dias_operacao_semana ?? ''}
                onChange={e => onChange('dias_operacao_semana', parseInt(e.target.value) || undefined)}
                className="input-field"
                placeholder="1–7"
              />
            </div>
          </div>

          <div className="field-group">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produção Diária Estimada</label>
              <input
                type="text"
                value={dados.producao_diaria_estimada || ''}
                onChange={e => onChange('producao_diaria_estimada', e.target.value)}
                className="input-field"
                placeholder="Ex: 2g de ouro/dia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início da Operação</label>
              <input
                type="date"
                value={dados.data_inicio_operacao || ''}
                onChange={e => onChange('data_inicio_operacao', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Método de Garimpo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método Utilizado para o Garimpo</label>
            <div className="space-y-2">
              {METODOS.map(m => (
                <label
                  key={m.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors
                    ${dados.metodo_garimpo === m.value
                      ? 'border-pmmg-green-400 bg-pmmg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <input
                    type="radio"
                    name="metodo_garimpo"
                    value={m.value}
                    checked={dados.metodo_garimpo === m.value}
                    onChange={() => onChange('metodo_garimpo', m.value)}
                    className="mt-0.5 text-pmmg-green-600 focus:ring-pmmg-green-500"
                  />
                  <span className="text-sm text-gray-700">{m.label}</span>
                </label>
              ))}
            </div>
            {dados.metodo_garimpo === 'outro' && (
              <textarea
                value={dados.metodo_garimpo_outro || ''}
                onChange={e => onChange('metodo_garimpo_outro', e.target.value)}
                className="input-field mt-3"
                rows={2}
                placeholder="Descreva o método utilizado..."
              />
            )}
          </div>

          {/* Ouro */}
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade de Ouro Armazenado na Draga (g)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={dados.qtd_ouro_gramas ?? ''}
                onChange={e => onChange('qtd_ouro_gramas', parseFloat(e.target.value) || undefined)}
                className="input-field pr-8"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Situação Minerária */}
      <div className="section-card">
        <div className="section-header">
          <FileText className="w-4 h-4" />
          6. Situação Minerária
        </div>
        <div className="p-5 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título Minerário</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TITULOS.map(t => (
                <label
                  key={t.value}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors
                    ${dados.titulo_minerario === t.value
                      ? 'border-pmmg-green-400 bg-pmmg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <input
                    type="radio"
                    name="titulo_minerario"
                    value={t.value}
                    checked={dados.titulo_minerario === t.value}
                    onChange={() => onChange('titulo_minerario', t.value)}
                    className="text-pmmg-green-600 focus:ring-pmmg-green-500"
                  />
                  <span className={`text-sm ${t.value === 'clandestino' ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
            {dados.titulo_minerario === 'outro' && (
              <input
                type="text"
                value={dados.titulo_minerario_outro || ''}
                onChange={e => onChange('titulo_minerario_outro', e.target.value)}
                className="input-field mt-3"
                placeholder="Descreva o título minerário..."
              />
            )}
          </div>

          {/* Nº Processo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Processo Minerário da Poligonal da Draga
            </label>
            <input
              type="text"
              value={dados.numero_processo_minerario || ''}
              onChange={e => onChange('numero_processo_minerario', e.target.value)}
              className="input-field"
              placeholder="Ex: 800.123/2024"
            />
          </div>

          {/* Informações complementares */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Informações Complementares
            </label>
            <textarea
              value={dados.informacoes_complementares || ''}
              onChange={e => onChange('informacoes_complementares', e.target.value)}
              className="input-field"
              rows={5}
              placeholder="Observações adicionais, auto de infração lavrado, encaminhamentos realizados..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
