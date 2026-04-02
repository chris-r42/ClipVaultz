import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

async function detectGame(videoId: string): Promise<string | null> {
  const thumbnailUrl = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`

  // Wait for thumbnail to be ready — retry up to 3 times with 3s delay
  let thumbnailReady = false
  for (let i = 0; i < 3; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 3000))
    try {
      const check = await fetch(thumbnailUrl, { method: 'HEAD' })
      if (check.ok) { thumbnailReady = true; break }
    } catch { /* continue */ }
  }
  if (!thumbnailReady) return null

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 32,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: thumbnailUrl },
            },
            {
              type: 'text',
              text: 'What video game is shown in this screenshot? Reply with only the game name (e.g. "Valorant", "Fortnite", "Warzone"). If you cannot identify the game, reply with exactly "Unknown".',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null
    if (!text || text.toLowerCase() === 'unknown') return null
    return text
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const novaBypass = cookieStore.get('nova_bypass')?.value === '1'
  const novaUsername = cookieStore.get('nova_username')?.value ?? 'Nova User'

  if (!user && !novaBypass) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId, title, description, game } = await request.json()

  if (!videoId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Use service role for bypass users to sidestep RLS
  const insertClient = novaBypass && !user
    ? createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      )
    : supabase

  const { data: clip, error } = await insertClient
    .from('clips')
    .insert({
      user_id: user?.id ?? null,
      nova_username: user ? null : novaUsername,
      cloudflare_video_id: videoId,
      title,
      description,
      game: game || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If no game was provided, try to detect it from the thumbnail
  if (!game && process.env.ANTHROPIC_API_KEY) {
    const detectedGame = await detectGame(videoId)
    if (detectedGame) {
      await supabase.from('clips').update({ game: detectedGame }).eq('id', clip.id)
    }
  }

  return NextResponse.json({ clipId: clip.id })
}
