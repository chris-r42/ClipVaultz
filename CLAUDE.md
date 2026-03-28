@AGENTS.md

# Clip Vault

A private gaming clip sharing website for a friend group. Built with Next.js 16, Supabase, Cloudflare Stream, and deployed on Vercel.

## Stack
- **Next.js 16.2.1** — App Router, TypeScript, Tailwind CSS v4
- **Supabase** — Postgres database, Auth (Discord + Google OAuth), RLS
- **Cloudflare Stream** — video upload and delivery
- **Vercel** — hosting

## What's been built
- Auth via Discord + Google OAuth (Supabase Auth)
- Invite-only access: new signups land on `/pending` until an admin approves them via `/admin`
- `proxy.ts` (Next.js 16's replacement for middleware) handles auth + approval gating on all routes
- Already-authenticated users are redirected away from `/login` automatically
- Feed page (`/`) — grid of all clips
- Upload page (`/upload`) — multi-file upload with per-clip titles, shared game/description, parallel uploads with individual progress bars
- Clip detail page (`/clips/[id]`) — Cloudflare Stream iframe player + metadata + comment section
- Admin page (`/admin`) — approve/revoke users, toggle admin role
- Comment system — post/delete comments on clips; admins can delete any comment; server actions + `revalidatePath` for instant refresh
- Supabase schema: `profiles`, `clips`, `comments` tables (profiles linked to auth.users via trigger)

## Key decisions / gotchas
- `proxy.ts` uses the **service role key** (bypasses RLS) to check approval status — this was necessary because RLS policies on `profiles` caused infinite recursion when checking approval inside other policies
- RLS policies are intentionally simple (just check `auth.uid() is not null`) — the proxy handles all approval/admin enforcement
- New user profiles are auto-created by a Postgres trigger (`on_auth_user_created`) on `auth.users` insert. `is_approved` defaults to `false`
- Admin manually approves users via `/admin` page or Supabase dashboard
- Next.js 16 renamed `middleware.ts` → `proxy.ts`, export function name is `proxy` not `middleware`

## Environment variables
See `.env.local` (not committed). Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_API_TOKEN`

## Deployment
- Live at `https://clipvault-one.vercel.app`
- Vercel auto-deploys on push to `main` branch of `github.com/chris-r42/ClipVaultz`
- Framework preset must be set to **Next.js** in Vercel project settings (not "Other")
- Supabase auth redirect URL: `https://clipvault-one.vercel.app/auth/callback`

## Next steps
1. **Phase 2 (future)** — AI features: auto tagging, clip highlights, video summary using Claude API.
