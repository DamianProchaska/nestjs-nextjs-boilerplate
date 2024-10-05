import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/profile', '/settings'];

export function middleware(req: NextRequest) {
  const isLoggedIn = req.cookies.get('accessToken'); // Sprawdzanie obecności tokenu JWT

  if (!isLoggedIn && protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*'],
};