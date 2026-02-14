import { NextRequest, NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  const isLoggedIn = request.cookies.get('user_session')?.value;

  // Define exactly which folders are private
  const isProtectedRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/students') || 
    path.startsWith('/id-generator');

  // If no cookie is found and user is trying to enter admin areas
  if (isProtectedRoute && !isLoggedIn) {
    // We redirect to login and add a "no-cache" header to the response
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware runs on EVERY subpage of these folders
  matcher: [
    '/dashboard/:path*', 
    '/students/:path*', 
    '/id-generator/:path*'
  ],
};