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
- Feed page (`/`) — grid of all clips
- Upload page (`/upload`) — direct upload to Cloudflare Stream, then saves metadata to Supabase
- Clip detail page (`/clips/[id]`) — Cloudflare Stream iframe player + metadata
- Admin page (`/admin`) — approve/revoke users, toggle admin role
- Supabase schema: `profiles` table (linked to auth.users via trigger), `clips` table

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

## Next steps
1. **Finish Vercel deployment** — user was in the middle of deploying when this session ended. Import repo on vercel.com, add all 5 env vars, deploy.
2. **Add Supabase auth redirect URL for production** — once Vercel gives a URL, add `https://your-app.vercel.app/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs.
3. **Test production** — sign in, upload a clip, verify everything works on the live URL.
4. **Phase 2 (future)** — AI features: auto tagging, clip highlights, video summary using Claude API.
