import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenErr) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const requesterUid = decodedToken.uid;

    // Verify requester exists and has ADMIN role in Firestore
    const adminDoc = await adminDb.collection('users').doc(requesterUid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only existing ADMIN users can provision new admins' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields: email and password' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Create Firebase Auth user server-side
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      password: password,
    });

    // Create user profile in Firestore
    const newAdminData = {
      uid: userRecord.uid,
      email: cleanEmail,
      role: 'ADMIN',
      teamId: null,
      createdAt: new Date().toISOString()
    };

    await adminDb.collection('users').doc(userRecord.uid).set(newAdminData);

    return NextResponse.json({ success: true, user: { uid: userRecord.uid, email: cleanEmail, role: 'ADMIN' } });
  } catch (error: any) {
    console.error('Create admin error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Failed to create admin' }, { status: 500 });
  }
}