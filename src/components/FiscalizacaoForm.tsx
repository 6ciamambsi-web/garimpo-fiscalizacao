'use client'
// src/components/FiscalizacaoForm.tsx
import { useState, useEffect } from 'react'
import { Save, X, FileDown, AlertCircle, CheckCircle } from 'lucide-react'
import type { Fiscalizacao, Militar, Alvo, Usuario } from '@/types'
import { validateCoordinates } from '@/lib/masks'
import { gerarPDF } from '@/lib/pdf-generator'
import SecaoDadosGerais from './form/SecaoDadosGerais'
import SecaoResponsavel from './form/SecaoResponsavel'
import SecaoTrabalhadores from './form/SecaoTrabalhadores'
import SecaoEstrutura from './form/SecaoEstrutura'
import SecaoCaracteristicas from './form/SecaoCaracteristicas'

interface Props {
  fiscalizacao?: Fiscalizacao
  usuario: Usuario
  onSalvo: (f: Fiscalizacao) => void
  onCancelar: () => void
}

const FORM_INICIAL: Partial<Fiscalizacao> = {
  equipe_ids: [],
  equipe_nomes: [],
  municipio: '',
  qtd_trabalhadores: 0,
  trabalhadores: [],
  qtd_balsa_draga: 0,
  qtd_motores: 0,
  qtd_bombas_succao: 0,
  qtd_compressores: 0,
  qtd_geradores: 0,
  qtd_embarcacoes_apoio: 0,
  qtd_roupas_mergulho: 0,
  qtd_mascaras_mergulho: 0,
  qtd_bateias: 0,
  qtd_respiradores: 0,
  qtd_balancas: 0,
  qtd_frascos_mercurio: 0,
  titulo_minerario: 'clandestino',
  metodo_garimpo: 'dragagem_aiuruoca',
  responsavel_principal_telefones: [''],
  status: 'ativo'
}

export default function FiscalizacaoForm({ fiscalizacao, usuario, onSalvo, onCancelar }: Props) {
  const [dados, setDados] = useState<Partial<Fiscalizacao>>(
    fiscalizacao ? { ...fiscalizacao } : { ...FORM_INICIAL }
  )
  const [militares, setMilitares] = useState<Militar[]>([])
  const [alvos, setAlvos] = useState<Alvo[]>([])
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/militares').then(r => r.json()).then(r => setMilitares(r.data || []))
    fetch('/api/alvos').then(r => r.json()).then(r => setAlvos(r.data || []))
  }, [])

  const onChange = (field: keyof Fiscalizacao, value: unknown) => {
    setDados(prev => ({ ...prev, [field]: value }))
    if (erros[field]) setErros(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const validar = (): boolean => {
    const novosErros: Record<string, string> = {}
    if (!dados.municipio?.trim()) novosErros.municipio = 'Município é obrigatório'
    if (dados.coordenadas_lat !== undefined && dados.coordenadas_lng !== undefined) {
      if (!validateCoordinates(
        dados.coordenadas_lat.toString(),
        dados.coordenadas_lng.toString()
      )) {
        novosErros.coordenadas = 'Coordenadas inválidas'
      }
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const showToast = (tipo: 'sucesso' | 'erro', msg: string) => {
    setToast({ tipo, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSalvar = async () => {
    if (!validar()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSalvando(true)
    try {
      const url = dados.id ? `/api/fiscalizacoes/${dados.id}` : '/api/fiscalizacoes'
      const method = dados.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erro ao salvar')
      showToast('sucesso', result.message || 'Salvo com sucesso!')
      onSalvo(result.data)
    } catch (err) {
      showToast('erro', err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const handlePDF = () => {
    if (dados.municipio) {
      gerarPDF(dados as Fiscalizacao, usuario.nome)
    } else {
      showToast('erro', 'Preencha ao menos o município antes de gerar o PDF.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium
          ${toast.tipo === 'sucesso'
            ? 'bg-pmmg-green-50 border-pmmg-green-200 text-pmmg-green-800'
            : 'bg-red-50 border-red-200 text-red-800'}`}>
          {toast.tipo === 'sucesso'
            ? <CheckCircle className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {dados.id ? 'Editar Fiscalização' : 'Nova Fiscalização'}
          </h2>
          {dados.id && (
            <p className="text-xs text-gray-500 mt-0.5">ID: {dados.id}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePDF} className="btn-secondary text-sm">
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Gerar PDF</span>
          </button>
          <button onClick={onCancelar} className="btn-secondary text-sm">
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancelar</span>
          </button>
          <button onClick={handleSalvar} disabled={salvando} className="btn-primary text-sm">
            {salvando ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Campos obrigatórios aviso */}
      {Object.keys(erros).length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Corrija os erros antes de salvar:</p>
            <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
              {Object.values(erros).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Seções do formulário */}
      <div className="space-y-5">
        <SecaoDadosGerais dados={dados} militares={militares} alvos={alvos} onChange={onChange} erros={erros} />
        <SecaoResponsavel dados={dados} onChange={onChange} erros={erros} />
        <SecaoTrabalhadores dados={dados} onChange={onChange} />
        <SecaoEstrutura dados={dados} onChange={onChange} />
        <SecaoCaracteristicas dados={dados} onChange={onChange} />
      </div>

      {/* Bottom save bar */}
      <div className="sticky bottom-0 mt-6 bg-white border-t border-gray-200 py-4 flex justify-end gap-3">
        <button onClick={handlePDF} className="btn-secondary">
          <FileDown className="w-4 h-4" />
          Gerar PDF
        </button>
        <button onClick={onCancelar} className="btn-secondary">
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button onClick={handleSalvar} disabled={salvando} className="btn-primary">
          <Save className="w-4 h-4" />
          {salvando ? 'Salvando...' : 'Salvar Fiscalização'}
        </button>
      </div>
    </div>
  )
}
