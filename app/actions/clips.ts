'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateClip(
  clipId: string,
  fields: { title: string; game: string; description: string }
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Must be clip owner or admin
  const [{ data: clip }, { data: profile }] = await Promise.all([
    supabase.from('clips').select('user_id').eq('id', clipId).single(),
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
  ])

  if (!clip) return { error: 'Clip not found.' }
  if (clip.user_id !== user.id && !profile?.is_admin) return { error: 'Not allowed.' }

  const title = fields.title.trim()
  if (!title) return { error: 'Title is required.' }

  await supabase
    .from('clips')
    .update({
      title,
      game: fields.game.trim() || null,
      description: fields.description.trim() || null,
    })
    .eq('id', clipId)

  revalidatePath(`/clips/${clipId}`)
  return null
}

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
