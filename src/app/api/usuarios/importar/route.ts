// src/app/api/usuarios/importar/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMilitaresFromSheets } from '@/lib/google-sheets'

const ADMINS_NPM = ['1386697', '1463223'] // Jessé e Thiago
const SENHA_PADRAO = 'Mudar@123'
const DOMINIO = '5ciapmmamb.pm.mg.gov.br'

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

    // Buscar NPMs já cadastrados
    const { data: existentes } = await supabase.from('usuarios').select('npm')
    const npmsExistentes = new Set((existentes || []).map((u: { npm: string }) => u.npm))

    const novos = militares.filter(m => !npmsExistentes.has(m.matricula))

    let importados = 0
    let erros = 0
    const detalhesErros: string[] = []

    // Criar service client para criar usuários no Auth
    const { createServiceClient } = await import('@/lib/supabase/server')
    const serviceClient = await createServiceClient()

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
        if (authError) throw authError

        // Inserir na tabela usuarios
        const { error: dbError } = await serviceClient.from('usuarios').insert({
          id: authData.user.id,
          nome: m.nome_completo,
          npm: m.matricula,
          posto_graduacao: m.posto_graduacao,
          unidade: '5ª CIA PM MAmb',
          perfil: ADMINS_NPM.includes(m.matricula) ? 'admin' : 'operacional',
          ativo: true,
          primeiro_acesso: true
        })
        if (dbError) throw dbError
        importados++
      } catch (err: unknown) {
        erros++
        detalhesErros.push(`${m.matricula} - ${m.nome_completo}: ${err instanceof Error ? err.message : 'erro'}`)
      }
    }

    return NextResponse.json({
      message: `Importação concluída: ${importados} importado(s), ${novos.length - importados} com erro, ${npmsExistentes.size} já existiam.`,
      importados,
      erros,
      ja_existiam: npmsExistentes.size,
      detalhes_erros: detalhesErros
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao importar usuários' }, { status: 500 })
  }
}
