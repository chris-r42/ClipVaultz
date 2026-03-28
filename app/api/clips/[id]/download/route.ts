import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the Cloudflare video ID from our DB
  const { data: clip } = await supabase
    .from('clips')
    .select('cloudflare_video_id, title')
    .eq('id', id)
    .single()

  if (!clip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN

  // Create (or fetch existing) download link from Cloudflare Stream
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${clip.cloudflare_video_id}/downloads`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Download not available' }, { status: 502 })
  }

  const { result } = await res.json()
  const downloadUrl = result?.default?.url

  if (!downloadUrl) {
    return NextResponse.json({ error: 'Download not ready yet' }, { status: 503 })
  }

  return NextResponse.redirect(downloadUrl)
}
