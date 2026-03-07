// middleware.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function middleware(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(
    'Content-Security-Policy',
    `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' https://fonts.gstatic.com https:;
    connect-src 'self' https:;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ') // Replace newline characters and spaces
  );

  const role = request.cookies.get('role')?.value;
  const root = request.cookies.get('root')?.value;

  if (!role || !root) return NextResponse.redirect(new URL('/logout', request.url));

  // Check the role and redirect based on the role
  switch (root) {
    case 'parent':
      // Add the paths that the parent can access here
      if (!request.nextUrl.pathname.startsWith('/parent')) {
        return NextResponse.redirect(new URL('/parent/home', request.url));
      }
      break;
    case 'school-admin':
      // Add the paths that the school admin can access here
      if (!request.nextUrl.pathname.startsWith('/school-admin')) {
        return NextResponse.redirect(new URL('/school-admin/home', request.url));
      }
      break;
    case 'teacher':
      // Add the paths that the teacher can access here
      if (!request.nextUrl.pathname.startsWith('/teacher')) {
        return NextResponse.redirect(new URL('/teacher/home', request.url));
      }
      break;
    case 'expert':
      // Add the paths that the teacher can access here
      if (!request.nextUrl.pathname.startsWith('/expert')) {
        return NextResponse.redirect(new URL('/expert/home', request.url));
      }
      break;
    case 'screening':
      // Add the paths that the analysiscrew can access here
      if (!request.nextUrl.pathname.startsWith('/screening')) {
        return NextResponse.redirect(new URL('/screening/home', request.url));
      }
      break;
    case 'analyst':
      // Add the paths that the registration team can access here
      if (!request.nextUrl.pathname.startsWith('/analyst')) {
        return NextResponse.redirect(new URL('/analyst/home', request.url));
      }
      break;
    case 'onground':
      // Add the paths that the on ground team can access here
      if (!request.nextUrl.pathname.startsWith('/onground')) {
        return NextResponse.redirect(new URL('/onground/home', request.url));
      }
      break;
    case 'admin':
      // Add the paths that the super admin can access here
      if (!request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin/home', request.url));
      }
      break;
    case 'health-buddy':
      // Add the paths that the health buddy can access here
      if (!request.nextUrl.pathname.startsWith('/health-buddy')) {
        return NextResponse.redirect(new URL('/health-buddy/home', request.url));
      }
      break;
    default:
      return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}

export const config = {
  matcher: [
    // Match all routes except the ones that start with /login and api and the static folder
    '/parent/:path*',
    '/admin/:path*',
    '/school-admin/:path*',
    '/teacher/:path*',
    '/expert/:path*',
    '/screening/:path*',
    '/analyst/:path*',
    '/onground/:path*',
    '/health-buddy/:path*',
  ],
};
