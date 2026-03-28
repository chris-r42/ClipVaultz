import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: clip } = await supabase
    .from('clips')
    .select('cloudflare_video_id, title')
    .eq('id', id)
    .single()

  if (!clip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN

  // POST is idempotent — triggers generation if not started, returns existing state if already processing/ready
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
  const status = result?.default?.status
  const downloadUrl = result?.default?.url

  if (status === 'inprogress') {
    return NextResponse.json(
      { error: 'Download is being prepared — try again in a few seconds.' },
      { status: 202 }
    )
  }

  if (status !== 'ready' || !downloadUrl) {
    return NextResponse.json(
      { error: 'Download not available for this clip.' },
      { status: 503 }
    )
  }

  return NextResponse.json({ url: downloadUrl })
}
