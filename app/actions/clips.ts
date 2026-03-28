'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteClip(clipId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return

  // Fetch clip to get Cloudflare video ID
  const { data: clip } = await supabase
    .from('clips')
    .select('cloudflare_video_id')
    .eq('id', clipId)
    .single()

  if (!clip) return

  // Delete from Cloudflare Stream
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${clip.cloudflare_video_id}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${apiToken}` } }
  )

  // Delete from database (cascade deletes comments)
  await supabase.from('clips').delete().eq('id', clipId)

  revalidatePath('/')
  redirect('/')
}
