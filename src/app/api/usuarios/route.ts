// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: usuarioAtual } = await supabase
      .from('usuarios').select('perfil').eq('id', user.id).single()
    if (usuarioAtual?.perfil !== 'admin')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome')
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: usuarioAtual } = await supabase
      .from('usuarios').select('perfil').eq('id', user.id).single()
    if (usuarioAtual?.perfil !== 'admin')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { id, perfil, ativo } = await request.json()
    const serviceClient = await createServiceClient()

    const { error } = await serviceClient.from('usuarios')
      .update({ perfil, ativo, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    return NextResponse.json({ message: 'Usuário atualizado com sucesso' })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}
