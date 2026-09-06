import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { UserRole } from '@/types';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { teamName, setupCode, password } = await request.json();

    // 1. Resolve team and verify setup code
    const teamsRef = adminDb.collection('teams');
    const teamSnapshot = await teamsRef.where('name', '==', teamName).get();
    
    if (teamSnapshot.empty) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    const teamDoc = teamSnapshot.docs[0];
    const teamData = teamDoc.data();

    if (teamData.authConfigured) {
      return NextResponse.json({ error: 'Team already registered' }, { status: 400 });
    }

    if (teamData.setupCode !== setupCode) {
      return NextResponse.json({ error: 'Invalid setup code' }, { status: 403 });
    }

    // 2. Provision Auth User
    const user = await adminAuth.createUser({
      email: `${teamDoc.id}@ipl-auction.local`,
      password: password,
      displayName: teamName,
    });

    // 3. Create user profile
    await adminDb.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      role: UserRole.TEAM,
      teamId: teamDoc.id,
      createdAt: new Date().toISOString()
    });

    // 4. Mark team as configured
    await teamDoc.ref.update({
      authConfigured: true,
      authUid: user.uid
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Setup team error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
