import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Helper for resilient fetch
async function fetchWithRetry(url: string, options: RequestInit, maxAttempts = 3): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return response;
    } catch (err: unknown) {
      clearTimeout(timeout);
      lastError = err;

      const isTransient = 
        (err instanceof Error && (err.name === 'AbortError' || err.message.includes('fetch failed'))) ||
        (typeof err === 'object' && err !== null && 'cause' in err && (err as any).cause?.code === 'ECONNRESET') ||
        (typeof err === 'object' && err !== null && 'cause' in err && (err as any).cause?.code === 'ECONNREFUSED') ||
        (typeof err === 'object' && err !== null && 'cause' in err && (err as any).cause?.code === 'ETIMEDOUT');

      if (isTransient && attempt < maxAttempts) {
        console.log(`LOGIN_DIAGNOSTIC: Attempt ${attempt} failed. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  try {
    const { teamName, password } = await request.json();

    // 1. Resolve team
    const teamsRef = adminDb.collection('teams');
    const teamSnapshot = await teamsRef.where('name', '==', teamName).get();
    
    if (teamSnapshot.empty) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    const teamDoc = teamSnapshot.docs[0];
    const teamData = teamDoc.data();

    if (!teamData.authConfigured || !teamData.authUid) {
      return NextResponse.json({ error: 'Team not registered' }, { status: 400 });
    }

    // 2. Verify Password using Firebase REST API with Retry
    const internalEmail = `${teamDoc.id}@ipl-auction.local`;
    
    let response;
    try {
      response = await fetchWithRetry(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: 'POST',
          body: JSON.stringify({ email: internalEmail, password, returnSecureToken: true }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err: unknown) {
      return NextResponse.json({ error: 'Temporary authentication service unavailable. Please try again.' }, { status: 503 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Password verified, mint custom token
    const customToken = await adminAuth.createCustomToken(teamData.authUid);
    
    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error('Login team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
