import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { teamId } = await req.json();
    if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });

    await adminDb.runTransaction(async (transaction) => {
      const teamRef = adminDb.collection('teams').doc(teamId);
      const teamSnap = await transaction.get(teamRef);
      if (!teamSnap.exists) throw new Error('TEAM_NOT_FOUND');

      const soldQuery = adminDb.collection('players')
        .where('currentTeamId', '==', teamId)
        .where('status', '==', 'SOLD');
      const soldSnap = await transaction.get(soldQuery);
      if (!soldSnap.empty) throw new Error('PROTECTED_TEAM_SOLD');

      const auctionRef = adminDb.collection('auction').doc('current');
      const auctionSnap = await transaction.get(auctionRef);
      const auctionData = auctionSnap.data();
      if (auctionData?.status === 'LIVE' && auctionData?.highestBidderTeamId === teamId) {
        throw new Error('PROTECTED_TEAM_LIVE');
      }

      transaction.delete(teamRef);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
