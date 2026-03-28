export type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  is_approved: boolean
  is_admin: boolean
  created_at: string
}

export type Comment = {
  id: string
  clip_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export type Clip = {
  id: string
  user_id: string
  title: string
  description: string | null
  game: string | null
  cloudflare_video_id: string
  thumbnail_url: string | null
  duration: number | null
  views: number
  created_at: string
  profiles?: Profile
}
