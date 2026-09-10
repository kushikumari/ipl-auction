"use client";

import { useState, useEffect } from "react";
import { subscribeToTeams } from "@/lib/teams";
import { subscribeToPlayers } from "@/lib/players";
import { Team, Player, PlayerStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, Users, DollarSign, Award, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userProfile && userProfile.role !== "ADMIN" && !isAdmin) {
      router.push("/login");
    }
    const unsubTeams = subscribeToTeams((data) => {
      setTeams(data);
      setLoading(false);
    });
    const unsubPlayers = subscribeToPlayers(setPlayers);
    return () => {
      unsubTeams();
      unsubPlayers();
    };
  }, [userProfile, isAdmin, router]);

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString()}`;
  };

  const getTeamPurchasedPlayersCount = (teamId: string) => {
    return players.filter(p => p.currentTeamId === teamId && p.status === PlayerStatus.SOLD).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-3 bg-slate-900/80 border border-white/10 hover:bg-slate-800 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
                <Shield className="text-amber-400 glow-text-gold" /> ALL IPL TEAMS &amp; MANAGEMENT
              </h1>
              <p className="text-slate-400 text-sm">
                Select a team card to manage members, authorized email access, and view real-time auction stats.
              </p>
            </div>
          </div>
        </header>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-white/10 text-center text-slate-400">
            <p className="text-lg">No teams found in database. Please seed teams from the Admin Control Room.</p>
            <Link
              href="/admin"
              className="mt-4 inline-flex items-center gap-2 btn-glass-gold px-6 py-2.5 rounded-xl font-bold text-xs uppercase"
            >
              Go to Admin Control Room
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((t, idx) => {
              const memberCount = t.members ? t.members.length : 0;
              const playersCount = getTeamPurchasedPlayersCount(t.id);

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                >
                  <Link
                    href={`/admin/teams/${t.id}`}
                    className="glass-card glass-card-hover p-6 rounded-3xl border border-white/10 hover:border-amber-400/60 shadow-xl flex flex-col justify-between block group transition-all duration-300 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90"
                  >
                    {/* Top Row: Team Name & Logo */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {t.logoUrl ? (
                          <img
                            src={t.logoUrl}
                            alt={t.name}
                            className="w-12 h-12 object-contain rounded-xl p-1 bg-black/40 border border-white/10"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black border border-amber-500/40">
                            {t.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-black text-white uppercase group-hover:text-amber-400 transition-colors">
                            {t.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono">Owner: {t.ownerName}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" size={22} />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs font-mono">
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Members</span>
                        <span className="text-base font-black text-indigo-300 flex items-center gap-1.5 mt-0.5">
                          <Users size={14} className="text-indigo-400" />
                          {memberCount} Members
                        </span>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Players Bought</span>
                        <span className="text-base font-black text-emerald-300 flex items-center gap-1.5 mt-0.5">
                          <Sparkles size={14} className="text-emerald-400" />
                          {playersCount} / 8
                        </span>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Amount Spent</span>
                        <span className="text-sm font-black text-amber-300 font-mono mt-0.5 block">
                          {formatCurrency(t.totalSpent || 0)}
                        </span>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Remaining Purse</span>
                        <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">
                          {formatCurrency(t.remainingBudget || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row: Total Points */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-mono uppercase">Total Squad Points</span>
                      <span className="text-lg font-black text-amber-400 glow-text-gold font-mono flex items-center gap-1">
                        <Award size={16} />
                        {t.totalPoints || 0} PTS
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
