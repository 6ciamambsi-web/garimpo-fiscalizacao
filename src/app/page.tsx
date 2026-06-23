// src/app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'
import type { Usuario } from '@/types'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!usuario || !usuario.ativo) {
    await supabase.auth.signOut()
    redirect('/login?error=inativo')
  }

  // Se primeiro acesso, redirecionar para troca de senha
  if (usuario.primeiro_acesso) {
    redirect('/primeiro-acesso')
  }

  return <DashboardClient usuario={usuario as Usuario} />
}
