import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const RATE_LIMIT = 10;
const WINDOW_IN_SECONDS = 3600;

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const response = NextResponse.next();

    // 1. SECURITY HEADERS
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 2. RATE LIMITING FOR AUDIT API
    if (pathname === '/api/audit/start') {
      if (redis) {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const key = `ratelimit:audit:${ip}`;
        
        try {
          const currentUsage = await redis.incr(key);
          if (currentUsage === 1) await redis.expire(key, WINDOW_IN_SECONDS);
          
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
        }
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        // Protect all /admin routes except /admin/login
        if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
