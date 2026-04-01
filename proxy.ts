import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Already logged in → skip the login page
  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Nova iframe bypass — set cookie if valid token present
  const bypassToken = request.nextUrl.searchParams.get('t')
  const validToken = process.env.NOVA_BYPASS_TOKEN
  if (validToken && bypassToken === validToken) {
    supabaseResponse.cookies.set('nova_bypass', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  }

  const novaBypass = request.cookies.get('nova_bypass')?.value === '1' ||
    (validToken != null && bypassToken === validToken)

  // Public routes — no auth needed
  const publicRoutes = ['/login', '/auth/callback', '/pending']
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    return supabaseResponse
  }

  // Not logged in → redirect to login (unless Nova bypass active)
  if (!user && !novaBypass) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Nova bypass users skip approval check
  if (!user && novaBypass) return supabaseResponse

  // Use service role key to bypass RLS for the approval check
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_approved, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) {
    return NextResponse.redirect(new URL('/pending', request.url))
  }

  // Admin routes — require is_admin
  if (pathname.startsWith('/admin') && !profile?.is_admin) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
