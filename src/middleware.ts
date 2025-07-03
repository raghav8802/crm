import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Add paths that don't require authentication
const publicPaths = [
  '/login', 
  '/api/auth/login', 
  '/api/auth/check',
  '/video-call', // Allow video call routes
  '/api/socketio' // Allow Socket.IO connections
];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname) || pathname.startsWith('/video-call/') || pathname.startsWith('/api/socketio')) {
    return NextResponse.next();
  }

  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userRole = payload.role as string;

    // Only protect the users page, allow API access
    if (pathname === '/users') {
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Redirect to login if token is invalid
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure which paths to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/socketio (Socket.IO connections)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/socketio).*)',
  ],
}; 