'use client'
// src/components/FiscalizacoesList.tsx
import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Plus, Edit2, Trash2, FileDown, Eye, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import type { Fiscalizacao, Usuario, FiscalizacaoFiltros } from '@/types'
import { formatDateTime } from '@/lib/masks'
import { gerarPDF } from '@/lib/pdf-generator'

interface Props {
  usuario: Usuario
  onNova: () => void
  onEditar: (f: Fiscalizacao) => void
  onVisualizar: (f: Fiscalizacao) => void
}

const TITULO_LABELS: Record<string, string> = {
  clandestino: 'Clandestino',
  portaria_lavra: 'Portaria de Lavra',
  permissao_lavra: 'Perm. Lavra Garimpeira',
  licenciamento: 'Licenciamento',
  registro_extracao: 'Registro de Extração',
  alvara_pesquisa: 'Alvará de Pesquisa',
  outro: 'Outro'
}

export default function FiscalizacoesList({ usuario, onNova, onEditar, onVisualizar }: Props) {
  const [registros, setRegistros] = useState<Fiscalizacao[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiscalizacaoFiltros>({})
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)

  const isAdmin = usuario.perfil === 'admin'
  const LIMIT = 15
  const totalPages = Math.ceil(total / LIMIT)

  const showToast = (tipo: 'ok' | 'erro', msg: string) => {
    setToast({ tipo, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        ...(filtros.data_inicio && { data_inicio: filtros.data_inicio }),
        ...(filtros.data_fim && { data_fim: filtros.data_fim }),
        ...(busca && { municipio: busca }),
        ...(filtros.titulo_minerario && { titulo_minerario: filtros.titulo_minerario })
      })
      const res = await fetch(`/api/fiscalizacoes?${params}`)
      const data = await res.json()
      setRegistros(data.data || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [page, filtros, busca])

  useEffect(() => { carregar() }, [carregar])

  const handleEditar = (f: Fiscalizacao) => {
    onEditar(f)
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Confirmar exclusão deste registro? Esta ação não pode ser desfeita.')) return
    setExcluindo(id)
    try {
      const res = await fetch(`/api/fiscalizacoes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        // Remover da lista local imediatamente
        setRegistros(prev => prev.filter(r => r.id !== id))
        setTotal(prev => prev - 1)
        showToast('ok', 'Registro excluído com sucesso.')
      } else {
        showToast('erro', data.error || 'Erro ao excluir.')
      }
    } catch {
      showToast('erro', 'Erro ao excluir.')
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.tipo === 'ok' ? 'bg-pmmg-green-50 border border-pmmg-green-200 text-pmmg-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => { setBusca(e.target.value); setPage(1) }}
              placeholder="Buscar por município..."
              className="input-field pl-9"
            />
          </div>
          <button onClick={() => setFiltroAberto(v => !v)}
            className={`btn-secondary ${filtroAberto ? 'bg-pmmg-green-50 border-pmmg-green-300' : ''}`}>
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <button onClick={carregar} className="btn-secondary p-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <button onClick={onNova} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nova Fiscalização
        </button>
      </div>

      {/* Filtros */}
      {filtroAberto && (
        <div className="bg-pmmg-green-50 border border-pmmg-green-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data início</label>
            <input type="date" value={filtros.data_inicio || ''}
              onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))}
              className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data fim</label>
            <input type="date" value={filtros.data_fim || ''}
              onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))}
              className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título Minerário</label>
            <select value={filtros.titulo_minerario || ''}
              onChange={e => setFiltros(f => ({ ...f, titulo_minerario: e.target.value as any || undefined }))}
              className="input-field text-sm">
              <option value="">Todos</option>
              {Object.entries(TITULO_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFiltros({}); setBusca(''); setPage(1) }}
              className="btn-secondary text-sm w-full justify-center">
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mb-3">
        {loading ? 'Carregando...' : `${total} registro(s) encontrado(s)`}
      </div>

      {/* Tabela */}
      <div className="section-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Data/Hora</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Município</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Alvo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Título</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Responsável</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhum registro encontrado</p>
                  <button onClick={onNova} className="mt-3 text-pmmg-green-600 hover:underline text-sm">
                    Cadastrar nova fiscalização
                  </button>
                </td>
              </tr>
            ) : (
              registros.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {r.created_at ? formatDateTime(r.created_at) : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.municipio}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{r.alvo_nome || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${r.titulo_minerario === 'clandestino' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {TITULO_LABELS[r.titulo_minerario] || r.titulo_minerario}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">
                    {r.responsavel_principal_nome || r.responsavel_local || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onVisualizar(r)}
                        title="Visualizar"
                        className="p-1.5 text-gray-500 hover:text-pmmg-green-700 hover:bg-pmmg-green-50 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditar(r)}
                        title="Editar"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => gerarPDF(r, usuario.nome)}
                        title="Gerar PDF"
                        className="p-1.5 text-gray-500 hover:text-pmmg-gold-600 hover:bg-pmmg-gold-50 rounded transition-colors cursor-pointer"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleExcluir(r.id!)}
                          disabled={excluindo === r.id}
                          title="Excluir"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary p-2 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${p === page ? 'bg-pmmg-green-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-secondary p-2 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
