@AGENTS.md

# Clip Vault

A private gaming clip sharing website for a friend group. Built with Next.js 16, Supabase, Cloudflare Stream, and deployed on Vercel.

## Stack
- **Next.js 16.2.1** — App Router, TypeScript, Tailwind CSS v4
- **Supabase** — Postgres database, Auth (Discord + Google OAuth), RLS
- **Cloudflare Stream** — video upload and delivery
- **Vercel** — hosting

## What's been built
- Auth via Discord + Google OAuth + email/password (Supabase Auth)
- Invite-only access: new signups land on `/pending` until an admin approves them via `/admin`
- `proxy.ts` (Next.js 16's replacement for middleware) handles auth + approval gating on all routes
- Already-authenticated users are redirected away from `/login` automatically
- Feed page (`/`) — responsive grid of all clips with sort dropdown (Newest/Most Viewed/Longest), game filter pills, search bar (`?q=`, `?sort=`, `?game=`)
- Upload page (`/upload`) — multi-file upload (max 10), per-clip titles, shared game/description, parallel uploads; stays on page after submit; game field has autocomplete dropdown from existing clips
- Background uploads — floating tray widget (bottom-right) persists while navigating the site; minimize/clear controls
- Clip detail page (`/clips/[id]`) — Cloudflare Stream iframe player + metadata + comments + download button; owners can edit metadata; admins can delete
- Admin page (`/admin`) — approve/revoke users, toggle admin role, admins can delete any clip or comment
- Comment system — post/delete comments; server actions + `revalidatePath`
- Download button — calls Cloudflare Downloads API, returns `{ url }` JSON, opens in new tab (avoids CORS)
- Search bar — 300ms debounce, updates `?q=` URL param, clear button; preserves sort/game params
- Left sidebar (desktop) with nav links, live members online/offline presence (Supabase Realtime), sign out, version number
- Top navbar (mobile only)
- Profile pages (`/profile/[username]`) — avatar, clip count, join date, clips grid
- Netflix-inspired UI — dark theme (`#141414`), thumbnail-first clip cards with hover gradient overlays
- Supabase schema: `profiles`, `clips`, `comments` tables (profiles linked to auth.users via trigger)
- Auto game detection — if game field is blank on upload, Claude Haiku identifies the game from the thumbnail (3 retries, 3s apart for thumbnail readiness)
- Railway compression worker (`D:\Coding\clip-vault-worker`) — files >150MB are compressed with FFmpeg (libx264, ultrafast, AAC 128k) before uploading to Cloudflare; returns `{ videoId }`
- Version system — `package.json` version baked into `NEXT_PUBLIC_APP_VERSION` via `next.config.ts`; displayed in sidebar footer

## Key decisions / gotchas
- `proxy.ts` uses the **service role key** (bypasses RLS) to check approval status — this was necessary because RLS policies on `profiles` caused infinite recursion when checking approval inside other policies
- RLS policies are intentionally simple (just check `auth.uid() is not null`) — the proxy handles all approval/admin enforcement
- New user profiles are auto-created by a Postgres trigger (`on_auth_user_created`) on `auth.users` insert. `is_approved` defaults to `false`
- Admin manually approves users via `/admin` page or Supabase dashboard
- Next.js 16 renamed `middleware.ts` → `proxy.ts`, export function name is `proxy` not `middleware`
- Cloudflare download: use `POST /downloads` to trigger generation, then return `{ url }` JSON — do NOT redirect, browser `fetch` can't follow cross-origin redirects
- Supabase Realtime presence: `channel.presenceState()` keyed by random keys — iterate `Object.values().flat()` to get all user_ids; Set deduplicates multiple tabs
- Admin clip deletion: `deleteClip` server action calls Cloudflare `DELETE /stream/{uid}` then removes DB row; redirects to feed after

## Environment variables
See `.env.local` (not committed). Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_API_TOKEN`
- `ANTHROPIC_API_KEY` — for auto game detection
- `WORKER_URL` — Railway worker base URL (must include `https://`)
- `WORKER_SECRET` — shared secret for Railway worker auth

## Deployment
- Live at `https://clipvault-one.vercel.app`
- Vercel auto-deploys on push to `main` branch of `github.com/chris-r42/ClipVaultz`
- Framework preset must be set to **Next.js** in Vercel project settings (not "Other")
- Supabase auth redirect URL: `https://clipvault-one.vercel.app/auth/callback`

## Versioning
- Version is defined in `package.json` and exposed as `NEXT_PUBLIC_APP_VERSION` via `next.config.ts`
- To release a new version: bump `package.json`, commit, `git tag vX.X.X`, push the tag
- Current version: **v1.0.0**

## Railway worker (`D:\Coding\clip-vault-worker`)
- Express + multer (disk storage) + fluent-ffmpeg + system ffmpeg installed via Dockerfile apt
- POST /upload — Bearer token auth, compress if >150MB (target 140MB, calculated bitrate), upload to Cloudflare, return `{ videoId }`
- Uses Dockerfile (not nixpacks) — nixpacks had issues with Railway secret injection during build
- Env vars needed on Railway: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_API_TOKEN`, `WORKER_SECRET`, `PORT`

## Key gotchas
- `WORKER_URL` in `.env.local` must include `https://` — without it XHR treats it as a relative path
- `WORKER_SECRET` on Railway must match `.env.local` exactly (no surrounding quotes)
- Auto game detection must be `await`ed before returning the API response — Vercel kills background tasks
- Sort/game filter/search all compose via URL params; preserve all three when updating any one

## Next steps
- No active todos — project is feature-complete at v1.0.0
- Potential future: clip highlights, video summaries, or other AI features via Claude API
