// src/app/api/fiscalizacoes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      .from('fiscalizacoes').select('*').eq('id', id).single()

    if (error || !data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
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

    const body = await request.json()

    // Campos que NÃO existem na tabela — remover antes de enviar
    const camposInvalidos = ['equipe_postos', 'equipe_npms', 'id', 'created_at']
    const payload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (!camposInvalidos.includes(key)) {
        payload[key] = value
      }
    }

    // Incluir campos extras que existem na tabela
    payload.equipe_postos = body.equipe_postos || []
    payload.equipe_npms   = body.equipe_npms || []
    payload.updated_at    = new Date().toISOString()

    const { data, error } = await supabase
      .from('fiscalizacoes')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PUT error:', JSON.stringify(error))
      return NextResponse.json({ error: `Erro ao atualizar: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Registro atualizado com sucesso' })
  } catch (err) {
    console.error('PUT unexpected error:', err)
    return NextResponse.json({ error: 'Erro inesperado ao atualizar' }, { status: 500 })
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

    // Verificar se é admin
    const { data: usuario } = await supabase
      .from('usuarios').select('perfil').eq('id', user.id).single()

    if (!usuario || usuario.perfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão para excluir' }, { status: 403 })
    }

    const { error } = await supabase
      .from('fiscalizacoes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DELETE error:', JSON.stringify(error))
      return NextResponse.json({ error: `Erro ao excluir: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Registro excluído com sucesso' })
  } catch (err) {
    console.error('DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Erro inesperado ao excluir' }, { status: 500 })
  }
}
