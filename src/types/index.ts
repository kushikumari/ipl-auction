export enum UserRole {
  ADMIN = 'ADMIN',
  TEAM = 'TEAM',
}

export enum PlayerRole {
  BATSMAN = 'BATSMAN',
  BOWLER = 'BOWLER',
  ALL_ROUNDER = 'ALL_ROUNDER',
  WICKET_KEEPER = 'WICKET_KEEPER',
}

export enum PlayerStatus {
  AVAILABLE = 'AVAILABLE',
  LIVE = 'LIVE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
}

export enum AuctionStatus {
  IDLE = 'IDLE',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
  COMPLETED = 'COMPLETED',
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  year?: string;
  branch?: string;
  collegeId?: string;
  favTeam?: string;
  role: UserRole;
  teamId?: string | null;
  createdAt: any;
}

// Member of a team
export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface Team {
  id: string;
  name: string;
  ownerName: string;
  logoUrl?: string | null;
  initialBudget: number;
  remainingBudget: number;
  totalSpent: number;
  playerCount: number;
  totalPoints: number;
  password?: string;
  setupCode: string;
  authConfigured: boolean;
  members?: Member[];
}

export interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
  role: PlayerRole;
  basePrice: number;
  points: number;
  status: PlayerStatus;
  currentTeamId?: string | null;
  soldPrice?: number | null;
}

export interface Bid {
  id: string;
  teamId: string;
  teamName: string;
  amount: number;
  timestamp: any;
}

export interface AuctionState {
  status: AuctionStatus;
  currentPlayerId?: string | null;
  currentBid: number;
  highestBidderTeamId?: string | null;
  highestBidderTeamName?: string | null;
  bidHistory: Bid[];
  startedAt?: any;
  updatedAt: any;
}

export interface AuctionTransaction {
  id: string;
  playerId: string;
  playerName: string;
  teamId?: string | null;
  teamName?: string | null;
  basePrice: number;
  finalBid: number;
  points: number;
  status: 'SOLD' | 'UNSOLD';
  timestamp: any;
  reversed?: boolean;
}

