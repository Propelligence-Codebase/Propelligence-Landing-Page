import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected API routes that require authentication (admin operations)
const protectedApiRoutes = [
  '/api/services',
  '/api/blogs', 
  '/api/testimonials',
  '/api/statistics'
];

// Public API routes that don't require authentication (frontend data)
const publicApiRoutes = [
  '/api/public/services',
  '/api/public/blogs',
  '/api/public/testimonials'
];

// Add public slug-check endpoints
const publicSlugCheckRoutes = [
  '/api/services/check-slug',
  '/api/blogs/check-slug'
];

// Admin pages that require authentication
const protectedAdminPages = [
  '/admin/panel'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Check if this is a public API route (allow access)
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Allow public access to slug-check endpoints
  const isPublicSlugCheckRoute = publicSlugCheckRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Allow public GET access to /api/statistics, /api/founders, /api/about-company
  if ((pathname.startsWith('/api/statistics') || pathname.startsWith('/api/founders') || pathname.startsWith('/api/about-company')) && method === 'GET') {
    return NextResponse.next();
  }

  // If it's a public route or slug-check, allow access
  if (isPublicApiRoute || isPublicSlugCheckRoute) {
    return NextResponse.next();
  }

  // Check if this is a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if this is a protected admin page
  const isProtectedAdminPage = protectedAdminPages.some(route => 
    pathname.startsWith(route)
  );

  // For API routes, check for admin authentication header
  if (isProtectedApiRoute) {
    const authHeader = request.headers.get('x-admin-auth');
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // Simple token-based auth for API routes
    const expectedToken = adminUsername && adminPassword 
      ? Buffer.from(`${adminUsername}:${adminPassword}`).toString('base64')
      : null;

    if (!authHeader || authHeader !== expectedToken) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // For admin pages, redirect to login if not authenticated
  if (isProtectedAdminPage) {
    const authCookie = request.cookies.get('admin-auth');
    
    if (!authCookie || authCookie.value !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match admin panel routes
    '/admin/panel/:path*'
  ],
}; 