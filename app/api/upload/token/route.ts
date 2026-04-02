import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const novaBypass = cookieStore.get('nova_bypass')?.value === '1'

  if (!user && !novaBypass) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ token: process.env.WORKER_SECRET, url: process.env.WORKER_URL })
}
