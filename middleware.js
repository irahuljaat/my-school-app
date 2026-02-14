import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check for the session cookie
  const hasSession = request.cookies.has('user_session');

  // If the user is trying to access protected routes without a session
  if (!hasSession) {
    // You can add more paths to this array if needed
    const protectedPaths = ['/dashboard', '/students', '/id-generator'];
    
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
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