'use client'
// src/app/login/page.tsx
import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        setErro('E-mail ou senha incorretos. Verifique seus dados.')
        return
      }
      router.push(redirect)
      router.refresh()
    } catch {
      setErro('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pmmg-green-900 via-pmmg-green-800 to-pmmg-green-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pmmg-green-800 to-pmmg-green-600 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-xl font-bold tracking-wide">PMMG — 3ª CIA PM MAmb</h1>
            <p className="text-pmmg-green-200 text-sm mt-1">Sistema de Fiscalização de Garimpo/Draga</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-gray-800 text-lg font-semibold mb-6">Acesso Restrito</h2>

            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {erro}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="seu@email.gov.br"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary justify-center py-3 text-base mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Entrar no Sistema
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Acesso restrito a militares autorizados.<br />
              Em caso de problemas, contate o administrador.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-pmmg-green-300 text-xs mt-4">
          © {new Date().getFullYear()} Polícia Militar de Minas Gerais
        </p>
      </div>
    </div>
  )
}
