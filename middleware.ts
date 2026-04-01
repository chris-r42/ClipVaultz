import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('t')
    const validToken = process.env.NOVA_BYPASS_TOKEN

    if (validToken && token === validToken) {
        const response = NextResponse.next()
        response.cookies.set('nova_bypass', '1', {
            httpOnly: true,
            secure: true,
            sameSite: 'none', // required for iframe cross-site cookies
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        })
        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
