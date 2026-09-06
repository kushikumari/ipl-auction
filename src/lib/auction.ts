import { 
  doc, 
  getDoc, 
  setDoc,
  runTransaction, 
  serverTimestamp, 
  onSnapshot, 
  collection, 
  updateDoc,
  Timestamp 
} from "firebase/firestore";

import { db } from "./firebase";
import { AuctionState, AuctionTransaction, Team, Player, AuctionStatus } from "@/types";

export class AuctionError extends Error {
  constructor(public code: string) { super(code); }
}

export const initializeAuction = async () => {
  const auctionRef = doc(db, "auction", "current");
  await setDoc(auctionRef, {
    status: AuctionStatus.IDLE,
    currentPlayerId: null,
    currentBid: 0,
    highestBidderTeamId: null,
    highestBidderTeamName: null,
    bidHistory: [],
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const subscribeToAuctionState = (
  callback: (auction: AuctionState | null) => void,
  onError: (error: Error) => void
) => {
  return onSnapshot(
    doc(db, "auction", "current"), 
    (doc) => {
      callback(doc.exists() ? (doc.data() as AuctionState) : null);
    },
    (error) => {
      console.error("Firestore auction subscription error:", error);
      onError(error);
    }
  );
};

export const startAuction = async (playerId: string) => {
  return await runTransaction(db, async (transaction) => {
    const playerRef = doc(db, "players", playerId);
    const playerSnap = await transaction.get(playerRef);
    const player = playerSnap.data() as Player;

    if (!player || player.status !== "AVAILABLE") throw new AuctionError("PLAYER_NOT_AVAILABLE");

    const auctionRef = doc(db, "auction", "current");
    transaction.update(playerRef, { status: "LIVE" });
    transaction.update(auctionRef, {
      status: "LIVE",
      currentPlayerId: playerId,
      currentBid: player.basePrice,
      highestBidderTeamId: null,
      highestBidderTeamName: null,
      bidHistory: [],
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
};

export const placeBid = async (teamId: string, amount: number) => {
  return await runTransaction(db, async (transaction) => {
    const auctionRef = doc(db, "auction", "current");
    const auctionSnap = await transaction.get(auctionRef);
    const auction = auctionSnap.data() as AuctionState;

    if (auction.status !== "LIVE") throw new AuctionError("AUCTION_NOT_LIVE");
    if (amount < auction.currentBid + 10) throw new AuctionError("BID_TOO_LOW");

    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await transaction.get(teamRef);
    const team = teamSnap.data() as Team;

    if (!team) throw new AuctionError("TEAM_NOT_FOUND");
    if (team.playerCount >= 8) throw new AuctionError("TEAM_FULL");
    if (amount > team.remainingBudget) throw new AuctionError("BID_EXCEEDS_BUDGET");

    transaction.update(auctionRef, {
      currentBid: amount,
      highestBidderTeamId: teamId,
      highestBidderTeamName: team.name,
      bidHistory: [...auction.bidHistory, {
        id: Math.random().toString(36).substr(2, 9),
        teamId,
        teamName: team.name,
        amount,
        timestamp: Timestamp.now()
      }],
      updatedAt: serverTimestamp()
    });
  });
};

export const sellCurrentPlayer = async () => {
  return await runTransaction(db, async (transaction) => {
    const auctionRef = doc(db, "auction", "current");
    const auctionSnap = await transaction.get(auctionRef);
    const auction = auctionSnap.data() as AuctionState;

    if (auction.status !== "LIVE" || !auction.currentPlayerId || !auction.highestBidderTeamId) {
      throw new AuctionError("INVALID_AUCTION_STATE");
    }

    const playerRef = doc(db, "players", auction.currentPlayerId);
    const playerSnap = await transaction.get(playerRef);
    const player = playerSnap.data() as Player;

    const teamRef = doc(db, "teams", auction.highestBidderTeamId);
    const teamSnap = await transaction.get(teamRef);
    const team = teamSnap.data() as Team;

    if (team.playerCount >= 8) {
      throw new AuctionError("TEAM_FULL");
    }

    transaction.update(playerRef, { status: "SOLD", currentTeamId: teamSnap.id, soldPrice: auction.currentBid });
    transaction.update(teamRef, {
      remainingBudget: team.remainingBudget - auction.currentBid,
      totalSpent: team.totalSpent + auction.currentBid,
      playerCount: team.playerCount + 1,
      totalPoints: team.totalPoints + player.points
    });
    transaction.set(doc(collection(db, "transactions")), {
        id: Math.random().toString(36).substr(2, 9),
        playerId: playerSnap.id,
        playerName: player.name,
        teamId: teamSnap.id,
        teamName: team.name,
        basePrice: player.basePrice,
        finalBid: auction.currentBid,
        points: player.points,
        status: 'SOLD',
        timestamp: serverTimestamp()
    });
    transaction.update(auctionRef, { 
        status: "IDLE", 
        currentPlayerId: null, 
        currentBid: 0, 
        highestBidderTeamId: null, 
        highestBidderTeamName: null,
        bidHistory: [],
        updatedAt: serverTimestamp() 
    });
  });
};

export const markUnsold = async () => {
  return await runTransaction(db, async (transaction) => {
    const auctionRef = doc(db, 'auction', 'current');
    const auction = (await transaction.get(auctionRef)).data() as AuctionState;
    if (auction.status !== "LIVE" || !auction.currentPlayerId) throw new AuctionError('NO_CURRENT_PLAYER');

    const playerRef = doc(db, 'players', auction.currentPlayerId);
    const playerSnap = await transaction.get(playerRef);
    transaction.update(playerRef, { status: 'UNSOLD' });
    
    transaction.set(doc(collection(db, 'transactions')), {
        id: Math.random().toString(36).substr(2, 9),
        playerId: auction.currentPlayerId,
        playerName: (playerSnap.data() as Player)?.name || "Unknown",
        status: 'UNSOLD',
        timestamp: serverTimestamp()
    });
    
    transaction.update(auctionRef, { 
        status: 'IDLE', 
        currentPlayerId: null, 
        currentBid: 0, 
        highestBidderTeamId: null, 
        highestBidderTeamName: null,
        bidHistory: [],
        updatedAt: serverTimestamp() 
    });
  });
};
