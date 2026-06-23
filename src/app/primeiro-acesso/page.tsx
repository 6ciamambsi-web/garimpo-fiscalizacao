'use client'
// src/app/primeiro-acesso/page.tsx
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('usuarios')
          .update({ primeiro_acesso: false })
          .eq('id', user.id)
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao alterar senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pmmg-green-900 via-pmmg-green-800 to-pmmg-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-pmmg-green-800 to-pmmg-green-600 px-8 py-6 text-center">
            <Shield className="w-10 h-10 text-white mx-auto mb-3" />
            <h1 className="text-white text-lg font-bold">Primeiro Acesso</h1>
            <p className="text-pmmg-green-200 text-sm mt-1">Crie uma nova senha para continuar</p>
          </div>

          <div className="px-8 py-8">
            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={show1 ? 'text' : 'password'}
                    required
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShow1(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {show1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={show2 ? 'text' : 'password'}
                    required
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    className={`input-field pl-10 pr-10 ${confirmar && confirmar !== novaSenha ? 'error' : ''}`}
                    placeholder="Repita a nova senha"
                  />
                  <button type="button" onClick={() => setShow2(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {show2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmar && confirmar !== novaSenha && (
                  <p className="text-red-500 text-xs mt-1">As senhas não coincidem</p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full btn-primary justify-center py-3 text-base">
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>Salvando...</>
                ) : (
                  <><Lock className="w-4 h-4" />Definir Nova Senha</>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-400">
              A senha deve ter pelo menos 6 caracteres.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
