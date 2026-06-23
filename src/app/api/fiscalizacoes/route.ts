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

    const payload = {
      equipe_ids:                     body.equipe_ids || [],
      equipe_nomes:                   body.equipe_nomes || [],
      equipe_postos:                  body.equipe_postos || [],
      equipe_npms:                    body.equipe_npms || [],
      alvo_id:                        body.alvo_id || null,
      alvo_nome:                      body.alvo_nome || null,
      municipio:                      body.municipio,
      coordenadas_lat:                body.coordenadas_lat || null,
      coordenadas_lng:                body.coordenadas_lng || null,
      hora_abordagem:                 body.hora_abordagem || null,
      responsavel_local:              body.responsavel_local || null,
      responsavel_principal_nome:     body.responsavel_principal_nome || null,
      responsavel_principal_cpf:      body.responsavel_principal_cpf || null,
      responsavel_principal_rg:       body.responsavel_principal_rg || null,
      responsavel_principal_endereco: body.responsavel_principal_endereco || null,
      responsavel_principal_telefones: body.responsavel_principal_telefones || [],
      qtd_trabalhadores:              body.qtd_trabalhadores || 0,
      trabalhadores:                  body.trabalhadores || [],
      qtd_balsa_draga:                body.qtd_balsa_draga || 0,
      qtd_motores:                    body.qtd_motores || 0,
      qtd_bombas_succao:              body.qtd_bombas_succao || 0,
      qtd_compressores:               body.qtd_compressores || 0,
      qtd_geradores:                  body.qtd_geradores || 0,
      qtd_embarcacoes_apoio:          body.qtd_embarcacoes_apoio || 0,
      qtd_roupas_mergulho:            body.qtd_roupas_mergulho || 0,
      qtd_mascaras_mergulho:          body.qtd_mascaras_mergulho || 0,
      qtd_bateias:                    body.qtd_bateias || 0,
      qtd_respiradores:               body.qtd_respiradores || 0,
      qtd_balancas:                   body.qtd_balancas || 0,
      qtd_frascos_mercurio:           body.qtd_frascos_mercurio || 0,
      horario_funcionamento:          body.horario_funcionamento || null,
      dias_operacao_semana:           body.dias_operacao_semana || null,
      producao_diaria_estimada:       body.producao_diaria_estimada || null,
      data_inicio_operacao:           body.data_inicio_operacao || null,
      metodo_garimpo:                 body.metodo_garimpo || 'dragagem_aiuruoca',
      metodo_garimpo_outro:           body.metodo_garimpo_outro || null,
      qtd_ouro_gramas:                body.qtd_ouro_gramas || null,
      titulo_minerario:               body.titulo_minerario || 'clandestino',
      titulo_minerario_outro:         body.titulo_minerario_outro || null,
      numero_processo_minerario:      body.numero_processo_minerario || null,
      informacoes_complementares:     body.informacoes_complementares || null,
      usuario_id:                     user.id,
      usuario_nome:                   usuario?.nome || '',
      usuario_npm:                    usuario?.npm || '',
      status:                         'ativo',
      updated_at:                     new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('fiscalizacoes')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', JSON.stringify(error))
      return NextResponse.json({ error: `Erro ao salvar: ${error.message}` }, { status: 500 })
    }

    // Google Sheets — não bloqueia o retorno
    try {
      const { gravarFiscalizacaoSheets } = await import('@/lib/google-sheets')
      await gravarFiscalizacaoSheets(data as Fiscalizacao)
    } catch (sheetsErr) {
      console.error('Sheets error (não crítico):', sheetsErr)
    }

    return NextResponse.json({ data, message: 'Fiscalização cadastrada com sucesso' }, { status: 201 })
  } catch (err) {
    console.error('POST fiscalizacoes unexpected error:', err)
    return NextResponse.json({ error: 'Erro inesperado ao cadastrar' }, { status: 500 })
  }
}
