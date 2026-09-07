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
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    doc(db, "auction", "current"), 
    (docSnap) => {
      callback(docSnap.exists() ? (docSnap.data() as AuctionState) : null);
    },
    (error) => {
      console.error("Firestore auction subscription error:", error);
      if (onError) onError(error);
    }
  );
};

export const startAuction = async (playerId: string) => {
  return await runTransaction(db, async (transaction) => {
    const playerRef = doc(db, "players", playerId);
    const playerSnap = await transaction.get(playerRef);
    if (!playerSnap.exists()) throw new AuctionError("PLAYER_NOT_FOUND");
    const player = playerSnap.data() as Player;

    if (player.status !== "AVAILABLE" && player.status !== "UNSOLD") {
      throw new AuctionError("PLAYER_NOT_AVAILABLE");
    }

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

export const pauseAuction = async () => {
  const auctionRef = doc(db, "auction", "current");
  await updateDoc(auctionRef, {
    status: AuctionStatus.PAUSED,
    updatedAt: serverTimestamp()
  });
};

export const resumeAuction = async () => {
  const auctionRef = doc(db, "auction", "current");
  await updateDoc(auctionRef, {
    status: AuctionStatus.LIVE,
    updatedAt: serverTimestamp()
  });
};

export const placeBid = async (teamId: string, amount: number) => {
  return await runTransaction(db, async (transaction) => {
    const auctionRef = doc(db, "auction", "current");
    const auctionSnap = await transaction.get(auctionRef);
    if (!auctionSnap.exists()) throw new AuctionError("AUCTION_NOT_FOUND");
    const auction = auctionSnap.data() as AuctionState;

    if (auction.status !== "LIVE") throw new AuctionError("AUCTION_NOT_LIVE");

    // If no team has placed a bid yet, the bid can start at basePrice.
    // If a bid already exists, the new bid must strictly exceed currentBid.
    if (auction.highestBidderTeamId === null) {
      if (amount < auction.currentBid) {
        throw new AuctionError("BID_TOO_LOW");
      }
    } else {
      if (amount <= auction.currentBid) {
        throw new AuctionError("BID_TOO_LOW");
      }
    }

    if (auction.highestBidderTeamId === teamId) {
      throw new AuctionError("ALREADY_HIGHEST_BIDDER");
    }

    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) throw new AuctionError("TEAM_NOT_FOUND");
    const team = teamSnap.data() as Team;

    if (team.playerCount >= 8) throw new AuctionError("TEAM_FULL");
    if (amount > team.remainingBudget) throw new AuctionError("BID_EXCEEDS_BUDGET");

    const newBidObj = {
      id: Math.random().toString(36).substring(2, 9),
      teamId,
      teamName: team.name,
      amount,
      timestamp: new Date().toISOString()
    };

    transaction.update(auctionRef, {
      currentBid: amount,
      highestBidderTeamId: teamId,
      highestBidderTeamName: team.name,
      bidHistory: [...(auction.bidHistory || []), newBidObj],
      updatedAt: serverTimestamp()
    });
  });
};

export const undoLastBid = async () => {
  return await runTransaction(db, async (transaction) => {
    const auctionRef = doc(db, "auction", "current");
    const auctionSnap = await transaction.get(auctionRef);
    if (!auctionSnap.exists()) throw new AuctionError("AUCTION_NOT_FOUND");
    const auction = auctionSnap.data() as AuctionState;

    if (!auction.bidHistory || auction.bidHistory.length === 0) {
      throw new AuctionError("NO_BIDS_TO_UNDO");
    }

    const playerRef = doc(db, "players", auction.currentPlayerId!);
    const playerSnap = await transaction.get(playerRef);
    const basePrice = playerSnap.exists() ? (playerSnap.data() as Player).basePrice : 0;

    const newHistory = auction.bidHistory.slice(0, -1);
    const previousBid = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

    transaction.update(auctionRef, {
      currentBid: previousBid ? previousBid.amount : basePrice,
      highestBidderTeamId: previousBid ? previousBid.teamId : null,
      highestBidderTeamName: previousBid ? previousBid.teamName : null,
      bidHistory: newHistory,
      updatedAt: serverTimestamp()
    });
  });
};

export const sellCurrentPlayer = async () => {
  return await runTransaction(db, async (transaction) => {
    const auctionRef = doc(db, "auction", "current");
    const auctionSnap = await transaction.get(auctionRef);
    if (!auctionSnap.exists()) throw new AuctionError("INVALID_AUCTION_STATE");
    const auction = auctionSnap.data() as AuctionState;

    if (auction.status !== "LIVE" && auction.status !== "PAUSED") {
      throw new AuctionError("INVALID_AUCTION_STATE");
    }
    if (!auction.currentPlayerId || !auction.highestBidderTeamId) {
      throw new AuctionError("NO_WINNING_BIDDER");
    }

    const playerRef = doc(db, "players", auction.currentPlayerId);
    const playerSnap = await transaction.get(playerRef);
    if (!playerSnap.exists()) throw new AuctionError("PLAYER_NOT_FOUND");
    const player = playerSnap.data() as Player;

    const teamRef = doc(db, "teams", auction.highestBidderTeamId);
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists()) throw new AuctionError("TEAM_NOT_FOUND");
    const team = teamSnap.data() as Team;

    if (team.playerCount >= 8) {
      throw new AuctionError("TEAM_FULL");
    }

    transaction.update(playerRef, { 
      status: "SOLD", 
      currentTeamId: teamSnap.id, 
      soldPrice: auction.currentBid 
    });

    transaction.update(teamRef, {
      remainingBudget: Math.max(0, team.remainingBudget - auction.currentBid),
      totalSpent: team.totalSpent + auction.currentBid,
      playerCount: team.playerCount + 1,
      totalPoints: team.totalPoints + (player.points || 0)
    });

    const txRef = doc(collection(db, "transactions"));
    transaction.set(txRef, {
      id: txRef.id,
      playerId: playerSnap.id,
      playerName: player.name,
      teamId: teamSnap.id,
      teamName: team.name,
      basePrice: player.basePrice,
      finalBid: auction.currentBid,
      points: player.points || 0,
      status: 'SOLD',
      timestamp: new Date().toISOString()
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
    const auctionSnap = await transaction.get(auctionRef);
    if (!auctionSnap.exists()) throw new AuctionError('AUCTION_NOT_FOUND');
    const auction = auctionSnap.data() as AuctionState;

    if (!auction.currentPlayerId) throw new AuctionError('NO_CURRENT_PLAYER');

    const playerRef = doc(db, 'players', auction.currentPlayerId);
    const playerSnap = await transaction.get(playerRef);
    const player = playerSnap.exists() ? (playerSnap.data() as Player) : null;

    transaction.update(playerRef, { status: 'UNSOLD' });
    
    const txRef = doc(collection(db, 'transactions'));
    transaction.set(txRef, {
      id: txRef.id,
      playerId: auction.currentPlayerId,
      playerName: player?.name || "Unknown",
      basePrice: player?.basePrice || 0,
      finalBid: 0,
      points: player?.points || 0,
      status: 'UNSOLD',
      timestamp: new Date().toISOString()
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

export const cancelCurrentAuction = async () => {
  return await runTransaction(db, async (transaction) => {
    const auctionRef = doc(db, 'auction', 'current');
    const auctionSnap = await transaction.get(auctionRef);
    if (!auctionSnap.exists()) return;
    const auction = auctionSnap.data() as AuctionState;

    if (auction.currentPlayerId) {
      const playerRef = doc(db, 'players', auction.currentPlayerId);
      const playerSnap = await transaction.get(playerRef);
      if (playerSnap.exists() && playerSnap.data()?.status === "LIVE") {
        transaction.update(playerRef, { status: 'AVAILABLE' });
      }
    }

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

export const rollbackTransaction = async (transactionId: string) => {
  return await runTransaction(db, async (transaction) => {
    const txRef = doc(db, "transactions", transactionId);
    const txSnap = await transaction.get(txRef);
    if (!txSnap.exists()) throw new AuctionError("TRANSACTION_NOT_FOUND");
    const txData = txSnap.data() as AuctionTransaction;

    if (txData.reversed) {
      throw new AuctionError("ALREADY_REVERSED");
    }

    if (txData.status === 'SOLD' && txData.teamId && txData.playerId) {
      const teamRef = doc(db, "teams", txData.teamId);
      const teamSnap = await transaction.get(teamRef);
      if (teamSnap.exists()) {
        const team = teamSnap.data() as Team;
        transaction.update(teamRef, {
          remainingBudget: team.remainingBudget + txData.finalBid,
          totalSpent: Math.max(0, team.totalSpent - txData.finalBid),
          playerCount: Math.max(0, team.playerCount - 1),
          totalPoints: Math.max(0, team.totalPoints - txData.points)
        });
      }

      const playerRef = doc(db, "players", txData.playerId);
      const playerSnap = await transaction.get(playerRef);
      if (playerSnap.exists()) {
        transaction.update(playerRef, {
          status: "AVAILABLE",
          currentTeamId: null,
          soldPrice: null
        });
      }
    } else if (txData.status === 'UNSOLD' && txData.playerId) {
      const playerRef = doc(db, "players", txData.playerId);
      const playerSnap = await transaction.get(playerRef);
      if (playerSnap.exists()) {
        transaction.update(playerRef, {
          status: "AVAILABLE"
        });
      }
    }

    transaction.update(txRef, { reversed: true });
  });
};
