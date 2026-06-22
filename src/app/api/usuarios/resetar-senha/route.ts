// src/app/api/usuarios/resetar-senha/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: usuarioAtual } = await supabase
      .from('usuarios').select('perfil').eq('id', user.id).single()
    if (usuarioAtual?.perfil !== 'admin')
      return NextResponse.json({ error: 'Apenas admins podem resetar senhas' }, { status: 403 })

    const { usuario_id } = await request.json()
    const serviceClient = await createServiceClient()

    // Resetar senha para padrão e marcar primeiro_acesso
    const { error } = await serviceClient.auth.admin.updateUserById(usuario_id, {
      password: 'Mudar@123'
    })
    if (error) throw error

    await serviceClient.from('usuarios')
      .update({ primeiro_acesso: true })
      .eq('id', usuario_id)

    return NextResponse.json({ message: 'Senha resetada para Mudar@123. Usuário deverá trocar no próximo acesso.' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao resetar senha' }, { status: 500 })
  }
}
