import { NextResponse } from 'next/server';

// This forces Vercel to skip the CommonJS compilation check
export const runtime = 'edge'; 

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('user_session');

  const protectedPaths = ['/dashboard', '/students', '/id-generator'];
  
  if (protectedPaths.some(path => pathname.startsWith(path)) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/students/:path*', 
    '/id-generator/:path*'
  ],
};