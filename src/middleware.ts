import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // This is a naive client-side check redirection for demo,
  // proper server-side auth checking in middleware requires firebase-admin (not added yet).
  // I will restrict navigation based on path.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/team/:path*', '/auction/:path*', '/history/:path*', '/leaderboard/:path*'],
};
