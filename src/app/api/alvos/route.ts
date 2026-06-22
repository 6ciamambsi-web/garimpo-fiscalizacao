// src/app/api/alvos/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAlvosFromSheets } from '@/lib/google-sheets'

export const revalidate = 300

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const alvos = await getAlvosFromSheets()
    return NextResponse.json({ data: alvos })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar alvos' }, { status: 500 })
  }
}
