// src/app/api/fiscalizacoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Fiscalizacao } from '@/types'

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
    if (titulo_minerario) query = query.eq('titulo_minerario', titulo_minerario)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ data, total: count, page, limit })
  } catch (err) {
    console.error('GET fiscalizacoes error:', err)
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
      .select('nome, npm, perfil')
      .eq('id', user.id)
      .single()

    const body = await request.json()

    if (!body.municipio?.trim()) {
      return NextResponse.json({ error: 'Município é obrigatório' }, { status: 400 })
    }

    // Remover campos que não existem na tabela do Supabase
    const camposExtras = ['equipe_postos', 'equipe_npms']
    const payload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (!camposExtras.includes(key)) {
        payload[key] = value
      }
    }

    // Adicionar metadados
    payload.usuario_id = user.id
    payload.usuario_nome = usuario?.nome || ''
    payload.usuario_npm = usuario?.npm || ''
    payload.trabalhadores = body.trabalhadores || []
    payload.equipe_ids = body.equipe_ids || []
    payload.equipe_nomes = body.equipe_nomes || []
    payload.updated_at = new Date().toISOString()
    payload.status = 'ativo'
    // Não enviar created_at — deixar o Supabase gerar
    delete payload.created_at
    delete payload.id

    const { data, error } = await supabase
      .from('fiscalizacoes')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', JSON.stringify(error))
      return NextResponse.json({ error: `Erro ao salvar: ${error.message}` }, { status: 500 })
    }

    // Gravar no Google Sheets de forma assíncrona — erro não bloqueia o retorno
    try {
      const { gravarFiscalizacaoSheets } = await import('@/lib/google-sheets')
      gravarFiscalizacaoSheets({
        ...data,
        equipe_postos: body.equipe_postos,
        equipe_npms: body.equipe_npms
      } as Fiscalizacao)
    } catch (sheetsErr) {
      console.error('Sheets error (não crítico):', sheetsErr)
    }

    return NextResponse.json({ data, message: 'Fiscalização cadastrada com sucesso' }, { status: 201 })
  } catch (err) {
    console.error('POST fiscalizacoes unexpected error:', err)
    return NextResponse.json({ error: 'Erro inesperado ao cadastrar' }, { status: 500 })
  }
}
