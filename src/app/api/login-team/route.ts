import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

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

    // 2. Verify Password using Firebase REST API
    const internalEmail = `${teamDoc.id}@ipl-auction.local`;
    
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({ email: internalEmail, password, returnSecureToken: true }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

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
