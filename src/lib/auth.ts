// src/lib/auth.ts
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Usuario } from '@/types'
import { headers } from 'next/headers'

export async function getUsuarioAtual(): Promise<Usuario | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()
    return data as Usuario | null
  } catch {
    return null
  }
}

export async function registrarAuditoria(params: {
  usuario_id: string
  usuario_nome: string
  usuario_npm?: string
  acao: string
  tabela: string
  registro_id: string
  dados_anteriores?: Record<string, unknown>
  dados_novos?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = await createServiceClient()
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') ||
                headersList.get('x-real-ip') || 'unknown'
    await supabase.from('audit_logs').insert({
      ...params,
      ip,
      created_at: new Date().toISOString()
    })
  } catch (err) {
    console.error('Erro ao registrar auditoria:', err)
  }
}

export function verificarPermissao(usuario: Usuario, nivel: 'admin' | 'operacional'): boolean {
  if (nivel === 'operacional') return true
  return usuario.perfil === 'admin'
}