"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  subscribeToAuctionState, 
  placeBid, 
  sellCurrentPlayer, 
  markUnsold,
  AuctionError 
} from "@/lib/auction";
import { subscribeToTeams } from "@/lib/teams";
import { subscribeToPlayer, subscribeToPlayers } from "@/lib/players";
import { AuctionState, Team, Player, AuctionStatus, UserRole, PlayerStatus, PlayerRole } from "@/types";
import { soundFx } from "@/lib/sound";
import { Loader2, Gavel, Users, Trophy, ArrowLeft, Shield, AlertCircle, History, Sparkles, CheckCircle2, Flame, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function AuctionRoom() {
  const { userProfile, team, loading: authLoading } = useAuth();
  const router = useRouter();
  const [auction, setAuction] = useState<AuctionState | null | undefined>(undefined);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !userProfile) router.push("/login");
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    const unsubAuction = subscribeToAuctionState(
      (data) => setAuction(data),
      (err) => setError("Failed to load auction data: " + err.message)
    );
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubPlayers = subscribeToPlayers(setAllPlayers);
    return () => {
      unsubAuction();
      unsubTeams();
      unsubPlayers();
    };
  }, []);

  useEffect(() => {
    if (auction?.currentPlayerId) {
      return subscribeToPlayer(auction.currentPlayerId, setCurrentPlayer);
    } else {
      setCurrentPlayer(null);
    }
  }, [auction?.currentPlayerId]);

  useEffect(() => {
    if (auction && currentPlayer) {
      const defaultIncrement = 100000; // 1 Lakh
      const nextMin = auction.currentBid > 0 
        ? auction.currentBid + defaultIncrement 
        : currentPlayer.basePrice;
      setBidAmount(nextMin);
    }
  }, [auction, currentPlayer]);

  const handleBid = async (amountToBid?: number) => {
    if (!team) return;
    const targetAmount = amountToBid ?? bidAmount;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await placeBid(team.id, targetAmount);
      soundFx.playBidSound();
      setSuccessMsg(`Bid of ${formatCurrency(targetAmount)} placed successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      if (err instanceof AuctionError) {
        switch (err.code) {
          case "AUCTION_NOT_LIVE": setError("Auction is currently paused or idle."); break;
          case "BID_TOO_LOW": setError("Your bid must be strictly higher than the current highest bid."); break;
          case "ALREADY_HIGHEST_BIDDER": setError("Your team already holds the current highest bid!"); break;
          case "TEAM_FULL": setError("Squad full! Your team already has maximum 8 players."); break;
          case "BID_EXCEEDS_BUDGET": setError("Bid amount exceeds your team's remaining purse balance."); break;
          default: setError(`Error: ${err.code}`);
        }
      } else {
        setError(err.message || "Failed to place bid");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    setLoading(true);
    setError(null);
    try {
      await sellCurrentPlayer();
      soundFx.playSoldSound();
    } catch (err: any) {
      setError(err.message || "Failed to mark sold");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsold = async () => {
    setLoading(true);
    setError(null);
    try {
      await markUnsold();
      soundFx.playUnsoldSound();
    } catch (err: any) {
      setError(err.message || "Failed to mark unsold");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString()}`;
  };

  const getRoleBadge = (role: PlayerRole) => {
    switch (role) {
      case PlayerRole.BATSMAN:
        return { label: "Batsman", icon: "🏏", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" };
      case PlayerRole.BOWLER:
        return { label: "Bowler", icon: "⚾", color: "bg-red-500/20 text-red-300 border-red-500/40" };
      case PlayerRole.ALL_ROUNDER:
        return { label: "All-Rounder", icon: "⚡", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      case PlayerRole.WICKET_KEEPER:
        return { label: "Wicket Keeper", icon: "🧤", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
      default:
        return { label: role, icon: "⭐", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  if (authLoading || auction === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-amber-500" size={44} />
      </div>
    );
  }

  if (auction === null) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Gavel size={64} className="text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Auction Room Inactive</h2>
        <p className="text-slate-400 mb-6">The auction document has not been created by an administrator yet.</p>
        <Link href={userProfile?.role === UserRole.ADMIN ? "/admin" : "/"} className="btn-glass-gold px-6 py-3 rounded-xl font-bold transition">
          Return Home
        </Link>
      </main>
    );
  }

  const teamPurchasedPlayers = allPlayers.filter(p => team && p.status === PlayerStatus.SOLD && p.currentTeamId === team.id);
  const isSquadFull = team ? team.playerCount >= 8 : false;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-4">
            <Link href={userProfile?.role === UserRole.ADMIN ? "/admin" : "/"} className="p-3 bg-slate-900/80 border border-white/10 hover:bg-slate-800 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3 text-white uppercase tracking-wider">
                <Gavel className="text-amber-400 glow-text-gold" /> LIVE BIDDING PORTAL
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 font-mono">STATUS:</span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                  auction.status === AuctionStatus.LIVE ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}>
                  {auction.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {team && (
              <div className="glass-card glass-card-gold px-6 py-3.5 rounded-2xl flex items-center gap-8 w-full md:w-auto justify-between border border-amber-500/30 shadow-xl">
                <div>
                  <p className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-widest">{team.name}</p>
                  <p className="text-2xl font-black text-amber-400 glow-text-gold font-mono">{formatCurrency(team.remainingBudget)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">SQUAD CAPACITY</p>
                  <p className={`text-lg font-bold font-mono ${isSquadFull ? 'text-red-400' : 'text-emerald-400'}`}>
                    {team.playerCount} / 8 MAX
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl flex items-center gap-3 shadow-xl backdrop-blur-md">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <span className="font-semibold text-sm">{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-2xl flex items-center gap-3 shadow-xl backdrop-blur-md">
              <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
              <span className="font-semibold text-sm">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Arena Layout */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Active Player Card & Bidding Controls */}
          <div className="lg:col-span-8 space-y-6">
            {currentPlayer ? (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card glass-card-hover p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                {/* Role Badge */}
                {getRoleBadge(currentPlayer.role) && (
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider mb-6 ${getRoleBadge(currentPlayer.role).color}`}>
                    <span>{getRoleBadge(currentPlayer.role).icon}</span>
                    {getRoleBadge(currentPlayer.role).label}
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                  <div className="w-36 h-36 rounded-2xl bg-slate-900 border-2 border-amber-500/40 flex items-center justify-center text-4xl font-black text-amber-400 overflow-hidden shadow-2xl flex-shrink-0">
                    {currentPlayer.photoUrl ? (
                      <img src={currentPlayer.photoUrl} alt={currentPlayer.name} className="w-full h-full object-cover" />
                    ) : (
                      currentPlayer.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
                      {currentPlayer.name}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-300 text-sm">
                      <p>Base Price: <span className="text-white font-mono font-bold">{formatCurrency(currentPlayer.basePrice)}</span></p>
                      <p>Rating: <span className="text-amber-400 font-bold">{currentPlayer.points || 0} pts</span></p>
                    </div>
                  </div>
                </div>

                {/* Current Highest Bid Highlight */}
                <div className="bg-slate-950/80 p-6 rounded-2xl border border-white/10 text-center mb-8 shadow-inner">
                  <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                    <Flame size={14} className="text-amber-400" /> CURRENT HIGHEST BID
                  </p>
                  <p className="text-5xl font-black text-amber-400 glow-text-gold font-mono">{formatCurrency(auction.currentBid)}</p>
                  <p className="mt-2 text-sm text-slate-300 font-medium">
                    Leading Team: <span className="text-amber-300 font-bold uppercase">{auction.highestBidderTeamName || "No Bids Placed"}</span>
                  </p>
                </div>

                {/* Interactive Fast Bidding Panel for Team */}
                {userProfile?.role === UserRole.TEAM && (
                  <div className="bg-slate-950/90 p-6 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-200 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                        <Zap size={16} className="text-amber-400" /> FAST INCREMENT CHIPS
                      </h3>
                      {isSquadFull && (
                        <span className="text-xs text-red-400 font-mono font-bold uppercase">SQUAD FULL (8/8)</span>
                      )}
                    </div>
                    
                    {/* Quick Increment Chip Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "+10 Lakhs", val: 100000 },
                        { label: "+20 Lakhs", val: 200000 },
                        { label: "+50 Lakhs", val: 500000 },
                        { label: "+1 Crore", val: 10000000 },
                      ].map((inc) => {
                        const nextBid = auction.currentBid > 0 ? auction.currentBid + inc.val : currentPlayer.basePrice;
                        const isDisabled = loading || isSquadFull || (team ? nextBid > team.remainingBudget : false) || auction.highestBidderTeamId === team?.id;

                        return (
                          <button
                            key={inc.label}
                            onClick={() => { setBidAmount(nextBid); handleBid(nextBid); }}
                            disabled={isDisabled}
                            className="py-3 px-4 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 hover:border-amber-400 font-black text-xs rounded-xl transition-all duration-300 disabled:opacity-30 disabled:hover:bg-slate-900 disabled:hover:text-slate-100 shadow-md"
                          >
                            {inc.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Amount Entry */}
                    <div className="flex gap-3 pt-2">
                      <input 
                        type="number" 
                        value={bidAmount} 
                        onChange={e => setBidAmount(parseInt(e.target.value) || 0)} 
                        className="bg-slate-900 px-4 py-3 rounded-xl flex-1 border border-white/10 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        placeholder="Enter custom bid"
                      />
                      <button 
                        onClick={() => handleBid()} 
                        disabled={loading || isSquadFull || (team ? bidAmount > team.remainingBudget : false) || auction.highestBidderTeamId === team?.id}
                        className="btn-glass-gold px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-40 shadow-xl"
                      >
                        {loading && <Loader2 size={16} className="animate-spin" />} PLACE BID
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin Quick Lot Controls */}
                {userProfile?.role === UserRole.ADMIN && (
                  <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4 justify-end">
                    <button 
                      onClick={handleSell} 
                      disabled={loading || !auction.highestBidderTeamId}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-40 shadow-lg"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />} DECLARE SOLD 🔨
                    </button>
                    <button 
                      onClick={handleUnsold} 
                      disabled={loading}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-40 shadow-lg"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />} DECLARE UNSOLD ❌
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="glass-card p-16 rounded-3xl border border-white/10 text-center space-y-4 shadow-2xl">
                <Gavel size={56} className="mx-auto text-slate-600 animate-float" />
                <h3 className="text-2xl font-black text-slate-200 uppercase">NO ACTIVE AUCTION LOT</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  {userProfile?.role === UserRole.ADMIN 
                    ? "Go to the Admin Control Panel to set a player lot live for bidding."
                    : "Please wait while the auctioneer announces the next player lot."}
                </p>
                {userProfile?.role === UserRole.ADMIN && (
                  <Link href="/admin" className="btn-glass-gold inline-block mt-4 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider">
                    Admin Control Panel
                  </Link>
                )}
              </div>
            )}

            {/* Live Bid Stream Log */}
            {auction.bidHistory && auction.bidHistory.length > 0 && (
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-200 text-xs font-mono uppercase tracking-widest">
                  <History size={16} className="text-amber-400" /> RECENT BID STREAM LOG
                </h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
                  {auction.bidHistory.slice().reverse().map((bid, idx) => (
                    <div key={bid.id || idx} className="flex justify-between items-center p-3 bg-slate-950/80 rounded-xl border border-white/5 text-sm">
                      <span className="font-semibold text-slate-300">{bid.teamName}</span>
                      <span className="font-mono text-amber-400 font-bold">{formatCurrency(bid.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Squad & Team Purse Monitor */}
          <div className="lg:col-span-4 space-y-6">
            {/* Squad Roster for logged team */}
            {team && (
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <h3 className="font-bold mb-4 flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-2 text-sm uppercase font-black">
                    <Shield size={18} className="text-amber-400" /> {team.name} Squad
                  </span>
                  <span className="text-xs text-amber-400 font-mono font-bold">{teamPurchasedPlayers.length}/8</span>
                </h3>

                {teamPurchasedPlayers.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No players acquired in this auction yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {teamPurchasedPlayers.map((p) => (
                      <div key={p.id} className="p-3 bg-slate-950/80 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-200">{p.name}</p>
                          <p className="text-slate-400 text-[10px] uppercase font-mono">{p.role}</p>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">{formatCurrency(p.soldPrice || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Participating Teams List */}
            <div className="glass-card p-6 rounded-3xl border border-white/10">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-200 text-xs font-mono uppercase tracking-widest">
                <Users size={16} className="text-amber-400" /> TEAM PURSE MONITOR
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {teams.map((t) => (
                  <div 
                    key={t.id} 
                    className={`p-3.5 rounded-2xl border transition-all ${
                      auction.highestBidderTeamId === t.id 
                        ? 'bg-amber-500/20 border-amber-500/80 shadow-lg shadow-amber-500/10' 
                        : 'bg-slate-950/80 border-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-sm">{t.name}</span>
                      <span className="text-amber-400 font-mono font-bold text-sm">{formatCurrency(t.remainingBudget)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Owner: {t.ownerName}</span>
                      <span className="font-mono">Squad: {t.playerCount}/8</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
