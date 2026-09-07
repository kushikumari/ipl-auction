"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  subscribeToAuctionState, 
  initializeAuction, 
  startAuction, 
  sellCurrentPlayer, 
  pauseAuction, 
  resumeAuction, 
  cancelCurrentAuction,
  undoLastBid,
  AuctionError 
} from "@/lib/auction";
import { subscribeToPlayers, createPlayer } from "@/lib/players";
import { subscribeToTeams, createTeam } from "@/lib/teams";
import { IPL_TEAMS_PRESETS, MARQUEE_INDIAN_PLAYERS } from "@/lib/seedIPL";
import { AuctionState, Player, Team, AuctionStatus, PlayerStatus, UserRole } from "@/types";
import { soundFx } from "@/lib/sound";
import { Loader2, Gavel, Users, LogOut, Database, UserPlus, Trophy, Clock, RefreshCw, BarChart3, Tv, Pause, Play, RotateCcw, History, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [auction, setAuction] = useState<AuctionState | null | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || userProfile?.role !== UserRole.ADMIN)) router.push("/login");
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    const unsubAuction = subscribeToAuctionState(setAuction, (err) => setError(err.message));
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTeams = subscribeToTeams(setTeams);
    return () => { unsubAuction(); unsubPlayers(); unsubTeams(); };
  }, []);

  const handleInitialize = async () => {
    setLoading(true); setError(null);
    try { await initializeAuction(); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSeedIPLData = async () => {
    if (!confirm("Seed 10 IPL Teams and 12 Star Indian Players into the database?")) return;
    setSeeding(true); setError(null); setSuccessMsg(null);
    try {
      // Seed Teams
      for (const t of IPL_TEAMS_PRESETS) {
        await createTeam({
          id: t.id,
          name: t.name,
          ownerName: t.ownerName,
          logoUrl: t.logoUrl,
          initialBudget: t.initialBudget,
          remainingBudget: t.initialBudget,
          totalSpent: 0,
          playerCount: 0,
          totalPoints: 0,
          setupCode: t.shortCode + "2026",
          authConfigured: false,
        });
      }

      // Seed Players
      for (const p of MARQUEE_INDIAN_PLAYERS) {
        await createPlayer({
          id: p.id,
          name: p.name,
          photoUrl: p.photoUrl,
          role: p.role,
          basePrice: p.basePrice,
          points: p.points,
          status: PlayerStatus.AVAILABLE,
          currentTeamId: null,
          soldPrice: null,
        });
      }

      await initializeAuction();
      setSuccessMsg("Successfully seeded 10 IPL Teams and 12 Marquee Indian Players!");
    } catch (err: any) {
      setError("Seeding failed: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleStartAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return alert("Select a player from the available pool");
    setLoading(true); setError(null);
    try {
      await startAuction(selectedPlayerId);
      setSelectedPlayerId("");
      router.push("/auction");
    } catch (err: any) { 
      setError(err instanceof AuctionError ? err.code : err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePauseToggle = async () => {
    if (!auction) return;
    setLoading(true); setError(null);
    try {
      if (auction.status === AuctionStatus.LIVE) {
        await pauseAuction();
      } else if (auction.status === AuctionStatus.PAUSED) {
        await resumeAuction();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUndoBid = async () => {
    setLoading(true); setError(null);
    try {
      await undoLastBid();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAuction = async () => {
    if (!confirm("Are you sure you want to cancel the current player auction? Player will be marked available.")) return;
    setLoading(true); setError(null);
    try {
      await cancelCurrentAuction();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || auction === undefined) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin text-amber-500" size={40} /></div>;
  if (!user || userProfile?.role !== UserRole.ADMIN) return null;

  const availablePlayers = players.filter(p => p.status === PlayerStatus.AVAILABLE || p.status === PlayerStatus.UNSOLD);
  const soldPlayers = players.filter(p => p.status === PlayerStatus.SOLD);
  const totalSpent = teams.reduce((acc, t) => acc + t.totalSpent, 0);
  const livePlayer = players.find(p => p.id === auction?.currentPlayerId);

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-white uppercase tracking-wider">
            <Gavel className="text-amber-400 glow-text-gold" /> ADMIN CONTROL ROOM
          </h1>
          <p className="text-slate-400 text-sm">Full administrative authority & control panel for college IPL auction.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedIPLData}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold uppercase transition shadow-lg hover:scale-105"
          >
            {seeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
            Seed 10 IPL Teams & 12 Players
          </button>
          <Link href="/projector" className="flex items-center gap-2 px-4 py-2.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-lg hover:scale-105">
            <Tv size={18} /> Broadcast Display
          </Link>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase transition shadow-lg">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">REGISTERED TEAMS</p>
          <h3 className="text-3xl font-black text-white mt-1">{teams.length}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">PLAYERS SOLD</p>
          <h3 className="text-3xl font-black text-emerald-400 mt-1">{soldPlayers.length} / {players.length}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">TOTAL PURSE SPENT</p>
          <h3 className="text-3xl font-black text-amber-400 font-mono mt-1">{formatCurrency(totalSpent)}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">AUCTION STATE</p>
          <h3 className={`text-2xl font-black uppercase mt-1 ${
            auction?.status === AuctionStatus.LIVE ? 'text-red-400 animate-pulse' : 'text-amber-400'
          }`}>
            {auction?.status || 'IDLE'}
          </h3>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <Link href="/admin/teams" className="glass-card glass-card-hover p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2 text-xs font-mono font-bold uppercase text-slate-200 shadow-lg">
          <Users size={24} className="text-amber-400" /> Manage Teams
        </Link>
        <Link href="/admin/players" className="glass-card glass-card-hover p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2 text-xs font-mono font-bold uppercase text-slate-200 shadow-lg">
          <UserPlus size={24} className="text-amber-400" /> Manage Players
        </Link>
        <Link href="/auction" className="glass-card glass-card-hover p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2 text-xs font-mono font-bold uppercase text-slate-200 shadow-lg">
          <Gavel size={24} className="text-amber-400" /> Live Auction Arena
        </Link>
        <Link href="/history" className="glass-card glass-card-hover p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2 text-xs font-mono font-bold uppercase text-slate-200 shadow-lg">
          <History size={24} className="text-amber-400" /> Audit Log & Rollback
        </Link>
        <Link href="/leaderboard" className="glass-card glass-card-hover p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2 text-xs font-mono font-bold uppercase text-slate-200 shadow-lg">
          <BarChart3 size={24} className="text-amber-400" /> Leaderboard
        </Link>
        <Link href="/projector" className="glass-card glass-card-blue p-4 rounded-2xl border border-indigo-500/40 flex flex-col items-center gap-2 text-xs font-mono font-bold uppercase text-indigo-300 shadow-lg">
          <Tv size={24} className="text-indigo-400" /> Projector View
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Lot Controller Panel */}
      {auction === null ? (
        <div className="glass-card p-10 rounded-3xl border border-white/10 text-center">
          <Database className="mx-auto text-slate-600 mb-4" size={48} />
          <h2 className="text-xl font-bold mb-4">Auction Database Document Uninitialized</h2>
          <div className="flex justify-center gap-4">
            <button onClick={handleInitialize} disabled={loading} className="btn-glass-gold px-6 py-3 rounded-xl font-bold text-xs uppercase">
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} className="inline mr-2" />} Initialize Empty Auction
            </button>
            <button onClick={handleSeedIPLData} disabled={seeding} className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-300 rounded-xl font-bold text-xs uppercase">
              {seeding ? <Loader2 className="animate-spin" /> : <Sparkles size={18} className="inline mr-2" />} Seed 10 IPL Teams & 12 Players
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Active Player Lot Controls */}
          <div className="lg:col-span-8 glass-card p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white uppercase tracking-wider">
              <Clock className="text-amber-400" /> PLAYER LOT CONTROLLER
            </h2>

            {auction.status === AuctionStatus.LIVE || auction.status === AuctionStatus.PAUSED ? (
              <div className="space-y-6">
                <div className="p-6 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest">ACTIVE LOT PLAYER</span>
                      <h3 className="text-3xl font-black text-white">{livePlayer?.name || "Player Loading..."}</h3>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{livePlayer?.role} • Base: {formatCurrency(livePlayer?.basePrice || 0)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">CURRENT BID</span>
                      <p className="text-3xl font-black text-amber-400 glow-text-gold font-mono">{formatCurrency(auction.currentBid)}</p>
                      <p className="text-xs text-slate-300 font-bold uppercase">{auction.highestBidderTeamName || "No Bids Yet"}</p>
                    </div>
                  </div>

                  {/* Pause / Resume & Quick Control Bar */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={handlePauseToggle}
                      disabled={loading}
                      className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs font-mono uppercase flex items-center gap-2 transition"
                    >
                      {auction.status === AuctionStatus.LIVE ? <><Pause size={16} /> Pause Bidding</> : <><Play size={16} /> Resume Bidding</>}
                    </button>

                    <button
                      onClick={handleUndoBid}
                      disabled={loading || !auction.bidHistory || auction.bidHistory.length === 0}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold rounded-xl text-xs font-mono uppercase flex items-center gap-2 transition disabled:opacity-40"
                    >
                      <RotateCcw size={16} /> Undo Last Bid
                    </button>

                    <button
                      onClick={handleCancelAuction}
                      disabled={loading}
                      className="px-4 py-2.5 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold rounded-xl text-xs font-mono uppercase flex items-center gap-2 transition"
                    >
                      Cancel Lot
                    </button>

                    <Link href="/auction" className="ml-auto btn-glass-gold px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition">
                      Enter Bidding Portal &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartAuction} className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Select Next Player to Put on Auction</label>
                  <select 
                    value={selectedPlayerId} 
                    onChange={e => setSelectedPlayerId(e.target.value)} 
                    required 
                    className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Player Lot ({availablePlayers.length} Available) --</option>
                    {availablePlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.role}] - Base Price: {formatCurrency(p.basePrice)} (Points: {p.points})
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || availablePlayers.length === 0} 
                  className="btn-glass-gold w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition shadow-xl disabled:opacity-40"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "START AUCTION LOT NOW"}
                </button>
              </form>
            )}
          </div>

          {/* Quick Team Purse Monitor */}
          <div className="lg:col-span-4 glass-card p-6 rounded-3xl border border-white/10 shadow-2xl">
            <h3 className="font-bold mb-4 text-slate-200 text-xs font-mono uppercase tracking-widest">TEAM PURSE SUMMARY</h3>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {teams.map(t => (
                <div key={t.id} className="p-3.5 bg-slate-950/80 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="text-slate-400 text-[10px] uppercase font-mono">Squad: {t.playerCount}/8</p>
                  </div>
                  <span className="font-mono text-amber-400 font-bold">{formatCurrency(t.remainingBudget)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
