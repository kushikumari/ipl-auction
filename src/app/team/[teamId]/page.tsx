"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscribeToTeam, subscribeToTeamMembers } from "@/lib/teams";
import { subscribeToPlayers } from "@/lib/players";
import { getTeamLogo } from "@/lib/teamLogos";
import { Team, Player, Member, PlayerStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  Shield, 
  ArrowLeft, 
  Award, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Lock, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  CheckCircle2, 
  Gavel, 
  Sparkles,
  UserCheck
} from "lucide-react";
import { motion } from "framer-motion";

export default function PrivateTeamDashboard() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();
  const { user, userProfile, isAdmin, loading: authLoading, logout } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Email state from local session / login verify if available
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if team member email verification was saved in session
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`authorized_team_${teamId}`);
      if (stored) setVerifiedEmail(stored.toLowerCase().trim());
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;

    const unsubTeam = subscribeToTeam(teamId, (data) => {
      setTeam(data);
      setLoading(false);
    });

    const unsubMembers = subscribeToTeamMembers(teamId, (data) => {
      setMembers(data as Member[]);
    });

    const unsubPlayers = subscribeToPlayers(setPlayers);

    return () => {
      unsubTeam();
      unsubMembers();
      unsubPlayers();
    };
  }, [teamId]);

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString()}`;
  };

  // Resolve user email: either from Firebase Auth or session verified email
  const currentUserEmail = user?.email?.toLowerCase().trim() || verifiedEmail || "";

  // Check Authorization
  const isRegisteredMember = members.some(
    (m) => m.email && m.email.toLowerCase().trim() === currentUserEmail
  ) || (team?.members && team.members.some(
    (m) => m.email && m.email.toLowerCase().trim() === currentUserEmail
  ));

  const isAuthorized = isAdmin || isRegisteredMember;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  // Team document not found
  if (!team) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
        <Link href="/" className="btn-glass-gold px-6 py-2.5 rounded-xl text-xs uppercase font-bold">
          Return to Home
        </Link>
      </div>
    );
  }

  // Access Denied Screen
  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 blur-[140px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 sm:p-10 rounded-3xl border border-red-500/40 max-w-md w-full text-center shadow-2xl bg-slate-900/90 relative z-10"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40">
            <Lock size={32} />
          </div>

          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            Access Restricted
          </h2>

          <p className="text-sm text-red-300 bg-red-950/60 p-4 rounded-2xl border border-red-500/30 mb-6 leading-relaxed font-medium">
            This email address <strong className="font-mono text-white underline">{currentUserEmail || "User"}</strong> is not authorized to access {team.name}&apos;s private dashboard.
          </p>

          <p className="text-xs text-slate-400 mb-6">
            Please select your authorized team on the home page and enter your registered email address configured by the Admin.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="btn-glass-gold py-3 rounded-xl font-black text-xs uppercase tracking-widest block text-center"
            >
              Select Authorized Team on Home
            </Link>
            
            {user && (
              <button
                onClick={() => logout()}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl border border-white/10"
              >
                Sign Out Current User
              </button>
            )}
          </div>
        </motion.div>
      </main>
    );
  }

  // Filter Purchased Players for this team
  const purchasedPlayers = players.filter(
    (p) => p.currentTeamId === teamId && p.status === PlayerStatus.SOLD
  );

  // Dynamic calculated figures
  const calculatedSpent = purchasedPlayers.reduce((acc, p) => acc + (p.soldPrice || 0), 0);
  const calculatedPoints = purchasedPlayers.reduce((acc, p) => acc + (p.points || 0), 0);
  const initialBudget = team.initialBudget || 100000000;
  const calculatedRemaining = Math.max(0, initialBudget - calculatedSpent);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative selection:bg-amber-500 selection:text-black">
      {/* Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-amber-500/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-3 bg-slate-900/80 border border-white/10 hover:bg-slate-800 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <img
                  src={getTeamLogo(team.id, team.logoUrl)}
                  alt={team.name}
                  className="w-12 h-12 object-contain rounded-xl p-1 bg-black/40 border border-white/10 drop-shadow"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/Team photos/${team.id.toLowerCase()}.svg`;
                  }}
                />
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    {team.name}
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono tracking-normal font-bold">
                      VERIFIED ACCESS
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Owner: {team.ownerName} • Logged in as: <span className="text-amber-400 font-semibold">{currentUserEmail}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auction"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Gavel size={16} /> Live Auction Arena
            </Link>

            {user && (
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-xl text-xs font-mono font-bold uppercase transition"
              >
                <LogOut size={16} /> Logout
              </button>
            )}
          </div>
        </header>

        {/* SECTION 1: Team Summary Statistics Cards */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
              PRIVATE TEAM SUMMARY &amp; BUDGET STATS
            </h2>
            <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
              <Sparkles size={12} /> Live Auto-Synchronized
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card glass-card-gold p-5 rounded-2xl border border-amber-500/40 shadow-xl bg-gradient-to-b from-amber-500/10 to-transparent">
              <span className="text-[10px] text-amber-300 font-mono uppercase font-bold tracking-wider block">TOTAL POINTS</span>
              <h3 className="text-3xl font-black text-amber-400 glow-text-gold font-mono mt-1">
                {calculatedPoints} <span className="text-xs font-sans text-slate-300">PTS</span>
              </h3>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold block">TOTAL BUDGET</span>
              <h3 className="text-xl font-black text-white font-mono mt-1">
                {formatCurrency(initialBudget)}
              </h3>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold block">AMOUNT SPENT</span>
              <h3 className="text-xl font-black text-amber-300 font-mono mt-1">
                {formatCurrency(calculatedSpent)}
              </h3>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold block">REMAINING PURSE</span>
              <h3 className="text-xl font-black text-amber-400 font-mono mt-1">
                {formatCurrency(calculatedRemaining)}
              </h3>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-xl col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold block">PLAYERS PURCHASED</span>
              <h3 className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {purchasedPlayers.length} / 8
              </h3>
            </div>
          </div>
        </section>

        {/* SECTION 2: Purchased Players List & Table */}
        <section className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <ShoppingBag className="text-amber-400" /> PURCHASED PLAYERS SQUAD
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Live list of players acquired by {team.name} in the auction.
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-amber-300 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
              {purchasedPlayers.length} / 8 Squad Limit
            </span>
          </div>

          {purchasedPlayers.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/60 rounded-2xl border border-white/5 text-slate-400">
              <p className="text-base font-semibold mb-1">No players purchased yet.</p>
              <p className="text-xs text-slate-500 font-mono">
                When the Admin completes player bids for {team.name}, they will automatically appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-amber-400 text-xs font-mono uppercase tracking-widest border-b border-white/10">
                    <th className="p-4 text-center">#</th>
                    <th className="p-4">Player Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Bid / Purchase Amount</th>
                    <th className="p-4 text-center">Player Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-mono">
                  {purchasedPlayers.map((player, index) => (
                    <motion.tr 
                      key={player.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="hover:bg-amber-500/10 transition-colors"
                    >
                      <td className="p-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="p-4 font-bold text-white font-sans uppercase text-base">
                        {player.name}
                      </td>
                      <td className="p-4 text-slate-300 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-200">
                          {player.role}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-amber-400 text-base">
                        {formatCurrency(player.soldPrice || 0)}
                      </td>
                      <td className="p-4 text-center font-black text-white text-base glow-text-gold">
                        {player.points} PTS
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
