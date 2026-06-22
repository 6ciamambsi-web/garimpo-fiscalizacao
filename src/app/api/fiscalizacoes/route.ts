// src/app/api/fiscalizacoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { registrarAuditoria } from '@/lib/auth'
import { gravarFiscalizacaoSheets } from '@/lib/google-sheets'
import type { Fiscalizacao, ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')
    const municipio = searchParams.get('municipio')
    const alvo_id = searchParams.get('alvo_id')
    const usuario_id = searchParams.get('usuario_id')
    const titulo_minerario = searchParams.get('titulo_minerario')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('fiscalizacoes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (data_inicio) query = query.gte('created_at', data_inicio)
    if (data_fim) query = query.lte('created_at', data_fim + 'T23:59:59')
    if (municipio) query = query.ilike('municipio', `%${municipio}%`)
    if (alvo_id) query = query.eq('alvo_id', alvo_id)
    if (usuario_id) query = query.eq('usuario_id', usuario_id)
    if (titulo_minerario) query = query.eq('titulo_minerario', titulo_minerario)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data, total: count, page, limit })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao buscar registros' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nome, perfil')
      .eq('id', user.id)
      .single()

    const body: Fiscalizacao = await request.json()

    // Validação básica
    if (!body.municipio) {
      return NextResponse.json({ error: 'Município é obrigatório' }, { status: 400 })
    }

    const payload = {
      ...body,
      usuario_id: user.id,
      usuario_nome: usuario?.nome || user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'ativo'
    }

    const { data, error } = await supabase
      .from('fiscalizacoes')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    // Gravar no Google Sheets (sem bloquear)
    gravarFiscalizacaoSheets(data as Fiscalizacao).catch(console.error)

    // Auditoria
    await registrarAuditoria({
      usuario_id: user.id,
      usuario_nome: usuario?.nome || user.email || '',
      acao: 'INSERT',
      tabela: 'fiscalizacoes',
      registro_id: data.id,
      dados_novos: data as Record<string, unknown>
    })

    return NextResponse.json({ data, message: 'Fiscalização cadastrada com sucesso' } as ApiResponse, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao cadastrar fiscalização' }, { status: 500 })
  }
}
