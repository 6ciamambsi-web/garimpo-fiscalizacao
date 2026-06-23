'use client'
// src/app/admin/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Upload, RefreshCw, Shield, UserCheck, UserX,
  RotateCcw, ArrowLeft, CheckCircle, AlertCircle, Search, Trash2
} from 'lucide-react'
import type { Usuario } from '@/types'

export default function AdminPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [importando, setImportando] = useState(false)
  const [busca, setBusca] = useState('')
  const [toast, setToast] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null)
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null)

  const showToast = (tipo: 'ok' | 'erro', msg: string) => {
    setToast({ tipo, msg })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
      if (!data || data.perfil !== 'admin') { router.push('/'); return }
      setUsuarioAtual(data as Usuario)
      carregarUsuarios()
    }
    init()
  }, [router])

  const carregarUsuarios = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      setUsuarios(data.data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleImportar = async () => {
    if (!confirm('Isso vai importar todos os militares da planilha que ainda não têm conta. Confirmar?')) return
    setImportando(true)
    try {
      const res = await fetch('/api/usuarios/importar', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('ok', data.message)
      carregarUsuarios()
    } catch (err) {
      showToast('erro', err instanceof Error ? err.message : 'Erro ao importar')
    } finally {
      setImportando(false)
    }
  }

  const handleTogglePerfil = async (u: Usuario) => {
    const novoPerfil = u.perfil === 'admin' ? 'operacional' : 'admin'
    if (!confirm(`Alterar ${u.nome} para ${novoPerfil === 'admin' ? 'Admin' : 'Operacional'}?`)) return
    const res = await fetch('/api/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, perfil: novoPerfil, ativo: u.ativo })
    })
    if (res.ok) { showToast('ok', 'Perfil atualizado!'); carregarUsuarios() }
    else showToast('erro', 'Erro ao atualizar perfil')
  }

  const handleToggleAtivo = async (u: Usuario) => {
    if (!confirm(`${u.ativo ? 'Desativar' : 'Reativar'} ${u.nome}?`)) return
    const res = await fetch('/api/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, perfil: u.perfil, ativo: !u.ativo })
    })
    if (res.ok) { showToast('ok', u.ativo ? 'Usuário desativado' : 'Usuário reativado'); carregarUsuarios() }
    else showToast('erro', 'Erro ao atualizar')
  }

  const handleExcluirUsuario = async (u: Usuario) => {
    if (!confirm(`Excluir permanentemente ${u.nome}? Esta ação não pode ser desfeita e o usuário perderá acesso ao sistema.`)) return
    try {
      const res = await fetch('/api/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id })
      })
      const data = await res.json()
      if (res.ok) { showToast('ok', 'Usuário excluído com sucesso.'); carregarUsuarios() }
      else showToast('erro', data.error || 'Erro ao excluir')
    } catch {
      showToast('erro', 'Erro ao excluir usuário')
    }
  }

  const handleResetarSenha = async (u: Usuario) => {
    if (!confirm(`Resetar senha de ${u.nome} para Mudar@123?`)) return
    const res = await fetch('/api/usuarios/resetar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: u.id })
    })
    const data = await res.json()
    if (res.ok) showToast('ok', data.message)
    else showToast('erro', data.error)
  }

  const filtrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.npm.includes(busca)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-pmmg-green-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-pmmg-gold-400" />
            <span className="text-white font-bold text-sm">5ª CIA PM MAmb — Gestão de Usuários</span>
          </div>
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-pmmg-green-200 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Sistema
          </button>
        </div>
      </header>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.tipo === 'ok' ? 'bg-pmmg-green-50 border border-pmmg-green-200 text-pmmg-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {toast.tipo === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', valor: usuarios.length, cor: 'text-gray-700' },
            { label: 'Admins', valor: usuarios.filter(u => u.perfil === 'admin').length, cor: 'text-pmmg-gold-600' },
            { label: 'Ativos', valor: usuarios.filter(u => u.ativo).length, cor: 'text-pmmg-green-700' },
            { label: '1º Acesso Pendente', valor: usuarios.filter(u => u.primeiro_acesso).length, cor: 'text-orange-600' }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold ${s.cor}`}>{s.valor}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou Nº PM..."
              className="input-field pl-9" />
          </div>
          <button onClick={carregarUsuarios} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button onClick={handleImportar} disabled={importando} className="btn-primary">
            {importando ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>Importando...</>
            ) : (
              <><Upload className="w-4 h-4" />Importar da Planilha</>
            )}
          </button>
        </div>

        {/* Tabela */}
        <div className="section-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nº PM</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Posto</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Perfil</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">1º Acesso</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhum usuário encontrado
                </td></tr>
              ) : (
                filtrados.map(u => (
                  <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!u.ativo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.npm}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.nome}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{u.posto_graduacao}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${u.perfil === 'admin' ? 'bg-pmmg-gold-100 text-pmmg-gold-800' : 'bg-gray-100 text-gray-700'}`}>
                        {u.perfil === 'admin' ? '⭐ Admin' : 'Operacional'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.primeiro_acesso
                        ? <span className="text-xs text-orange-600 font-medium">Pendente</span>
                        : <span className="text-xs text-green-600">OK</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleTogglePerfil(u)} title={u.perfil === 'admin' ? 'Tornar Operacional' : 'Tornar Admin'}
                          className="p-1.5 text-gray-500 hover:text-pmmg-gold-600 hover:bg-pmmg-gold-50 rounded transition-colors">
                          <Shield className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleResetarSenha(u)} title="Resetar senha"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleAtivo(u)} title={u.ativo ? 'Desativar' : 'Reativar'}
                          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors">
                          {u.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        {u.id !== usuarioAtual?.id && (
                          <button onClick={() => handleExcluirUsuario(u)} title="Excluir permanentemente"
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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

        <div className="mt-4 bg-pmmg-green-50 border border-pmmg-green-200 rounded-lg p-4 text-sm text-pmmg-green-800">
          <p className="font-medium mb-1">Como funciona:</p>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li><strong>Importar da Planilha</strong> — puxa todos os militares da aba "militares" e cadastra automaticamente com senha <code>5ciamamb</code></li>
            <li><strong>Escudo</strong> — alterna entre Admin e Operacional</li>
            <li><strong>Seta circular</strong> — reseta a senha para <code>Mudar@123</code></li>
            <li><strong>X/Check</strong> — desativa ou reativa o acesso ao sistema</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
