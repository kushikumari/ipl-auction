"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeToAuctionState } from "@/lib/auction";
import { subscribeToPlayers } from "@/lib/players";
import { subscribeToTeams } from "@/lib/teams";
import { AuctionState, Player, Team, PlayerRole, AuctionStatus } from "@/types";
import { soundFx } from "@/lib/sound";
import { Trophy, Volume2, VolumeX, Shield, User, Sparkles, Award, Zap, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ProjectorPage() {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [lastBidAmount, setLastBidAmount] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsubAuction = subscribeToAuctionState((state) => {
      setAuctionState(state);

      if (state && state.currentBid > 0 && state.currentBid !== lastBidAmount) {
        if (lastBidAmount > 0) {
          soundFx.playBidSound();
        }
        setLastBidAmount(state.currentBid);
      }
    });

    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTeams = subscribeToTeams(setTeams);

    return () => {
      unsubAuction();
      unsubPlayers();
      unsubTeams();
    };
  }, [lastBidAmount]);

  const currentPlayer = players.find((p) => p.id === auctionState?.currentPlayerId);
  const leadingTeam = teams.find((t) => t.id === auctionState?.highestBidderTeamId);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} Lakhs`;
    return `₹ ${amount.toLocaleString()}`;
  };

  const getRoleBadge = (role: PlayerRole) => {
    switch (role) {
      case PlayerRole.BATSMAN:
        return { label: "Batsman", icon: "🏏", color: "bg-blue-500/20 border-blue-500/50 text-blue-300" };
      case PlayerRole.BOWLER:
        return { label: "Bowler", icon: "⚾", color: "bg-red-500/20 border-red-500/50 text-red-300" };
      case PlayerRole.ALL_ROUNDER:
        return { label: "All-Rounder", icon: "⚡", color: "bg-amber-500/20 border-amber-500/50 text-amber-300" };
      case PlayerRole.WICKET_KEEPER:
        return { label: "Wicket Keeper", icon: "🧤", color: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" };
      default:
        return { label: role, icon: "⭐", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Stadium Glow Spots */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-indigo-600/20 via-amber-500/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/15 blur-[140px] pointer-events-none" />

      {/* Broadcast Header Bar */}
      <header className="px-8 py-5 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/25">
            <Trophy size={28} className="text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-amber-400 uppercase glow-text-gold">
              IPL AUCTION <span className="text-white">LIVE</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">STADIUM BROADCAST SCREEN</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {auctionState?.status === AuctionStatus.LIVE && (
            <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-mono font-bold text-xs animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500"></span> LIVE BIDDING
            </div>
          )}

          {auctionState?.status === AuctionStatus.PAUSED && (
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs">
              AUCTION PAUSED
            </div>
          )}

          <button
            onClick={handleToggleMute}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 rounded-2xl border border-white/10 text-slate-300 transition-all duration-300 hover:scale-105 shadow-lg"
            title={isMuted ? "Unmute Stadium Sound" : "Mute Stadium Sound"}
          >
            {isMuted ? <VolumeX size={20} className="text-red-400" /> : <Volume2 size={20} className="text-emerald-400 animate-pulse" />}
          </button>
        </div>
      </header>

      {/* Main Broadcast Stage */}
      <AnimatePresence mode="wait">
        {currentPlayer && (auctionState?.status === AuctionStatus.LIVE || auctionState?.status === AuctionStatus.PAUSED) ? (
          <motion.section 
            key="live-arena"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10"
          >
            {/* Left Card: High-Impact Player Banner */}
            <div className="lg:col-span-6 glass-card glass-card-gold rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px] border border-amber-500/30">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-9xl text-amber-400 pointer-events-none select-none">
                IPL
              </div>

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    {getRoleBadge(currentPlayer.role) && (
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-bold text-xs uppercase tracking-wider mb-4 ${getRoleBadge(currentPlayer.role).color}`}>
                        <span>{getRoleBadge(currentPlayer.role).icon}</span>
                        {getRoleBadge(currentPlayer.role).label}
                      </span>
                    )}
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-none drop-shadow-md">
                      {currentPlayer.name}
                    </h2>
                  </div>

                  <div className="bg-amber-500/15 border border-amber-500/40 px-4 py-2.5 rounded-2xl text-center shadow-lg">
                    <span className="text-[10px] text-amber-400 font-mono uppercase block">RATING</span>
                    <span className="text-2xl font-black text-amber-400 glow-text-gold">{currentPlayer.points || 0} pts</span>
                  </div>
                </div>

                {/* Player Photo */}
                <div className="my-6 flex justify-center">
                  {currentPlayer.photoUrl ? (
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      src={currentPlayer.photoUrl}
                      alt={currentPlayer.name}
                      className="w-52 h-52 md:w-64 md:h-64 object-cover rounded-3xl border-4 border-amber-500/50 shadow-2xl shadow-amber-500/20"
                    />
                  ) : (
                    <div className="w-52 h-52 md:w-64 md:h-64 bg-slate-900/90 rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                      <User size={72} className="mb-2 text-slate-600" />
                      <span className="text-xs uppercase font-mono tracking-widest">NO PHOTO AVAILABLE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Base Price Bar */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                <span className="text-slate-400 text-xs font-mono font-bold uppercase tracking-widest">BASE PRICE</span>
                <span className="text-2xl font-black text-white font-mono">{formatCurrency(currentPlayer.basePrice)}</span>
              </div>
            </div>

            {/* Right Column: Dynamic Live Bidding & Leading Team */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Massive Current Bid Display */}
              <div className="glass-card p-8 rounded-3xl text-center border-2 border-amber-500/60 shadow-2xl relative overflow-hidden animate-pulse-ring">
                <div className="text-amber-400 text-xs font-mono font-black tracking-widest uppercase mb-2 flex items-center justify-center gap-2">
                  <Flame size={16} className="animate-bounce" /> CURRENT HIGHEST BID
                </div>
                <motion.div 
                  key={auctionState.currentBid}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  className="text-5xl md:text-7xl font-black text-amber-400 glow-text-gold tracking-tight my-2"
                >
                  {formatCurrency(auctionState.currentBid)}
                </motion.div>

                {/* Leading Team Spotlight */}
                {leadingTeam ? (
                  <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-4">
                    {leadingTeam.logoUrl ? (
                      <img src={leadingTeam.logoUrl} alt={leadingTeam.name} className="w-14 h-14 object-contain drop-shadow-md" />
                    ) : (
                      <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                        <Shield size={32} />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-widest">HOLDING TOP BID</div>
                      <div className="text-2xl md:text-3xl font-black text-white tracking-wide uppercase">{leadingTeam.name}</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-white/10 text-slate-400 text-sm font-medium italic">
                    Waiting for opening bid from participating teams...
                  </div>
                )}
              </div>

              {/* Real-time Bid History Stream */}
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <h3 className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles size={16} /> LIVE BID TICKER STREAM
                </h3>
                {auctionState.bidHistory && auctionState.bidHistory.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {auctionState.bidHistory
                      .slice()
                      .reverse()
                      .slice(0, 5)
                      .map((bid, idx) => (
                        <div
                          key={bid.id || idx}
                          className={`flex justify-between items-center p-3.5 rounded-2xl border transition-all ${
                            idx === 0
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-lg shadow-amber-500/10"
                              : "bg-slate-950/60 border-white/5 text-slate-300"
                          }`}
                        >
                          <span className="font-bold text-sm uppercase">{bid.teamName}</span>
                          <span className="font-mono text-base font-black text-amber-400">{formatCurrency(bid.amount)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs italic text-center py-4">No bids placed in this lot yet</div>
                )}
              </div>
            </div>
          </motion.section>
        ) : (
          /* Idle Screen between lots */
          <motion.section 
            key="idle-stage"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10"
          >
            <div className="glass-card glass-card-gold p-10 rounded-3xl max-w-2xl w-full flex flex-col items-center border border-amber-500/40 shadow-2xl">
              <Trophy size={72} className="text-amber-400 mb-6 animate-float glow-text-gold" />
              <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-3">NEXT PLAYER LOT PREPARING</h2>
              <p className="text-slate-300 text-sm max-w-md mb-8">
                The auctioneer is loading the next player lot. Participating team owners, get ready with your purses!
              </p>

              {/* Team Purse Overview Grid */}
              <div className="w-full bg-slate-950/80 rounded-2xl p-5 border border-white/10 text-left">
                <h4 className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-3">
                  CURRENT PURSE STANDINGS
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {teams.map((t) => (
                    <div key={t.id} className="p-3.5 bg-slate-900/90 rounded-xl border border-white/10 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200 truncate">{t.name}</span>
                      <span className="font-mono text-amber-400 font-bold">{formatCurrency(t.remainingBudget)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Broadcast Ticker Footer */}
      <footer className="bg-slate-950/90 border-t border-white/10 py-3.5 px-8 flex justify-between items-center text-xs text-slate-400 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <span className="font-mono text-amber-400 font-bold uppercase tracking-wider">TEAMS: {teams.length}</span>
          <span className="font-mono">MAX SQUAD: 8 PLAYERS</span>
        </div>
        <div className="flex gap-6 font-semibold">
          <Link href="/leaderboard" className="hover:text-amber-400 transition">
            Leaderboard
          </Link>
          <Link href="/auction" className="hover:text-amber-400 transition">
            Team Bidding Portal
          </Link>
        </div>
      </footer>
    </main>
  );
}
