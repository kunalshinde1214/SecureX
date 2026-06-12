import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// Only initialize Redis if tokens are present (to avoid crashing in local dev without Upstash)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limit config: 10 requests per hour per IP for API scans
const RATE_LIMIT = 10;
const WINDOW_IN_SECONDS = 3600; // 1 hour

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. SECURITY HEADERS
  const response = NextResponse.next();
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Strict Transport Security (HSTS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 2. RATE LIMITING FOR AUDIT API
  if (pathname === '/api/audit/start') {
    if (redis) {
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const key = `ratelimit:audit:${ip}`;
      
      try {
        const currentUsage = await redis.incr(key);
        
        if (currentUsage === 1) {
          await redis.expire(key, WINDOW_IN_SECONDS);
        }
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString());
        response.headers.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - currentUsage).toString());
        
        if (currentUsage > RATE_LIMIT) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Maximum 10 scans per hour. Please try again later.' },
            { status: 429, headers: response.headers }
          );
        }
      } catch (err) {
        console.error('Redis rate limit error:', err);
        // Fail open if Redis fails, but log it
      }
    }
  }

  return response;
}

// Config ensures middleware runs on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
