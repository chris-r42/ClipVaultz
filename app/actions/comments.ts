'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function postComment(clipId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Comment cannot be empty' }

  const { error } = await supabase
    .from('comments')
    .insert({ clip_id: clipId, user_id: user.id, content: trimmed })

  if (error) return { error: error.message }

  revalidatePath(`/clips/${clipId}`)
  return { error: null }
}

export async function deleteComment(commentId: string, clipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) return { error: error.message }

  revalidatePath(`/clips/${clipId}`)
  return { error: null }
}
