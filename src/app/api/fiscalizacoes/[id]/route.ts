// src/app/api/fiscalizacoes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { registrarAuditoria, verificarPermissao } from '@/lib/auth'
import type { Fiscalizacao } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data, error } = await supabase
      .from('fiscalizacoes')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar registro' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nome, perfil')
      .eq('id', user.id)
      .single()

    // Buscar registro atual para auditoria
    const { data: anterior } = await supabase
      .from('fiscalizacoes')
      .select('*')
      .eq('id', id)
      .single()

    const body: Partial<Fiscalizacao> = await request.json()

    const { data, error } = await supabase
      .from('fiscalizacoes')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await registrarAuditoria({
      usuario_id: user.id,
      usuario_nome: usuario?.nome || user.email || '',
      acao: 'UPDATE',
      tabela: 'fiscalizacoes',
      registro_id: id,
      dados_anteriores: anterior as Record<string, unknown>,
      dados_novos: data as Record<string, unknown>
    })

    return NextResponse.json({ data, message: 'Registro atualizado com sucesso' })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nome, perfil')
      .eq('id', user.id)
      .single()

    if (!verificarPermissao(usuario as any, 'admin')) {
      return NextResponse.json({ error: 'Sem permissão para excluir registros' }, { status: 403 })
    }

    const { data: anterior } = await supabase
      .from('fiscalizacoes')
      .select('*')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('fiscalizacoes')
      .delete()
      .eq('id', id)

    if (error) throw error

    await registrarAuditoria({
      usuario_id: user.id,
      usuario_nome: usuario?.nome || user.email || '',
      acao: 'DELETE',
      tabela: 'fiscalizacoes',
      registro_id: id,
      dados_anteriores: anterior as Record<string, unknown>
    })

    return NextResponse.json({ message: 'Registro excluído com sucesso' })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir registro' }, { status: 500 })
  }
}
