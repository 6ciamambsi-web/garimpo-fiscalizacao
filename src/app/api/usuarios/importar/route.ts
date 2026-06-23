// src/app/api/usuarios/importar/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getMilitaresFromSheets } from '@/lib/google-sheets'

const ADMINS_NPM = ['1386697', '1463223']
const SENHA_PADRAO = 'Mudar@123'
const DOMINIO = 'pmmg.mg.gov.br'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: usuarioAtual } = await supabase
      .from('usuarios').select('perfil').eq('id', user.id).single()
    if (usuarioAtual?.perfil !== 'admin')
      return NextResponse.json({ error: 'Apenas admins podem importar usuários' }, { status: 403 })

    const militares = await getMilitaresFromSheets()
    if (!militares.length)
      return NextResponse.json({ error: 'Nenhum militar encontrado na planilha' }, { status: 400 })

    const serviceClient = await createServiceClient()

    // Buscar emails já cadastrados no Auth
    const { data: authUsers } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
    const emailsExistentes = new Set((authUsers?.users || []).map(u => u.email))

    // Buscar npms já cadastrados na tabela usuarios
    const { data: existentes } = await serviceClient.from('usuarios').select('npm')
    const npmsExistentes = new Set((existentes || []).map((u: { npm: string }) => u.npm).filter(Boolean))

    const novos = militares.filter(m => 
      m.matricula && 
      !npmsExistentes.has(m.matricula) &&
      !emailsExistentes.has(`${m.matricula}@${DOMINIO}`)
    )

    let importados = 0
    let erros = 0
    const detalhesErros: string[] = []

    for (const m of novos) {
      try {
        const email = `${m.matricula}@${DOMINIO}`

        // Criar no Auth
        const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
          email,
          password: SENHA_PADRAO,
          email_confirm: true,
          user_metadata: { npm: m.matricula, nome: m.nome_completo }
        })
        if (authError) throw new Error(`Auth: ${authError.message}`)

        // Inserir/atualizar na tabela usuarios com todos os campos
        const { error: dbError } = await serviceClient.from('usuarios').upsert({
          id: authData.user.id,
          nome: m.nome_completo,
          npm: m.matricula,
          posto_graduacao: m.posto_graduacao,
          unidade: '5ª CIA PM MAmb',
          perfil: ADMINS_NPM.includes(m.matricula) ? 'admin' : 'operacional',
          ativo: true,
          primeiro_acesso: true
        }, { onConflict: 'id' })

        if (dbError) throw new Error(`DB: ${dbError.message}`)
        importados++
      } catch (err: unknown) {
        erros++
        detalhesErros.push(`${m.matricula} - ${m.nome_completo}: ${err instanceof Error ? err.message : 'erro'}`)
      }
    }

    // Atualizar npm e posto dos que já existem mas estão sem esses dados
    for (const m of militares) {
      if (!m.matricula) continue
      await serviceClient.from('usuarios')
        .update({ 
          npm: m.matricula, 
          posto_graduacao: m.posto_graduacao,
          nome: m.nome_completo
        })
        .eq('npm', m.matricula)
        .is('posto_graduacao', null)
    }

    // Atualizar todos que têm npm mas posto vazio
    for (const m of militares) {
      if (!m.matricula) continue
      await serviceClient.from('usuarios')
        .update({ 
          npm: m.matricula,
          posto_graduacao: m.posto_graduacao 
        })
        .eq('nome', m.nome_completo)
        .or('npm.is.null,posto_graduacao.eq.')
    }

    return NextResponse.json({
      message: `Importação concluída: ${importados} importado(s), ${erros} com erro, ${npmsExistentes.size} já existiam.`,
      importados,
      erros,
      ja_existiam: npmsExistentes.size,
      detalhes_erros: detalhesErros.slice(0, 5)
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao importar usuários' }, { status: 500 })
  }
}