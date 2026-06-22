// src/app/api/militares/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMilitaresFromSheets } from '@/lib/google-sheets'

export const revalidate = 300 // Cache por 5 minutos

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const militares = await getMilitaresFromSheets()
    return NextResponse.json({ data: militares })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar militares' }, { status: 500 })
  }
}
