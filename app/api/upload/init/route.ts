import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: 300, // 5 min max
        requireSignedURLs: false,
      }),
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
  }

  const { result } = await res.json()
  return NextResponse.json({
    uploadUrl: result.uploadURL,
    videoId: result.uid,
  })
}
