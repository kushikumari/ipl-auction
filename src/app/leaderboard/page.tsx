"use client";

import { useState, useEffect } from "react";
import { subscribeToTeams } from "@/lib/teams";
import { subscribeToPlayers } from "@/lib/players";
import { subscribeToGlobalSettings } from "@/lib/settings";
import { getTeamLogo } from "@/lib/teamLogos";
import { useAuth } from "@/context/AuthContext";
import { Team, Player, PlayerRole, PlayerStatus } from "@/types";
import { Trophy, Award, Users, Shield, ArrowLeft, Download, Eye, Sparkles, X, Lock, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function LeaderboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [leaderboardVisible, setLeaderboardVisible] = useState<boolean>(false);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubSettings = subscribeToGlobalSettings((settings) => {
      setLeaderboardVisible(settings.leaderboardVisible);
      setSettingsLoading(false);
    });

    return () => {
      unsubTeams();
      unsubPlayers();
      unsubSettings();
    };
  }, []);

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.playerCount !== a.playerCount) return b.playerCount - a.playerCount;
    return b.remainingBudget - a.remainingBudget;
  });

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString()}`;
  };

  const getTeamSquad = (teamId: string) => {
    return players.filter((p) => p.status === PlayerStatus.SOLD && p.currentTeamId === teamId);
  };

  const getSquadRoleCounts = (teamId: string) => {
    const squad = getTeamSquad(teamId);
    return {
      batsmen: squad.filter((p) => p.role === PlayerRole.BATSMAN).length,
      bowlers: squad.filter((p) => p.role === PlayerRole.BOWLER).length,
      allRounders: squad.filter((p) => p.role === PlayerRole.ALL_ROUNDER).length,
      wicketKeepers: squad.filter((p) => p.role === PlayerRole.WICKET_KEEPER).length,
    };
  };

  const exportCSV = () => {
    const headers = ["Rank", "Team Name", "Owner Name", "Total Points", "Players Acquired", "Total Spent", "Remaining Purse"];
    const rows = sortedTeams.map((t, index) => [
      index + 1,
      `"${t.name}"`,
      `"${t.ownerName}"`,
      t.totalPoints,
      t.playerCount,
      t.totalSpent,
      t.remainingBudget,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IPL_Auction_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (settingsLoading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-amber-400" size={40} />
        <p className="font-mono text-sm uppercase tracking-widest">Loading Standings...</p>
      </div>
    );
  }

  if (!leaderboardVisible && !isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background glow decorative elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full glass-card glass-card-gold rounded-3xl p-8 text-center relative z-10 border border-amber-500/30 shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock size={40} className="animate-pulse" />
          </div>

          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-block mb-4">
            Live Results Hidden
          </span>

          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-3">
            Leaderboard Locked
          </h1>

          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            The live standings and auction rankings are currently hidden by the auction administrator. Results will be made visible once the auction controller enables public access.
          </p>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-sm font-mono uppercase tracking-wider transition-all duration-200 shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
          >
            <ArrowLeft size={18} /> Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto">
        {!leaderboardVisible && isAdmin && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-amber-300 text-xs font-mono">
            <div className="flex items-center gap-2">
              <EyeOff size={16} className="text-amber-400 shrink-0" />
              <span><strong>Admin Notice:</strong> The leaderboard is currently <strong>HIDDEN</strong> from public users. You are viewing this page in Admin Preview mode.</span>
            </div>
            <Link href="/admin" className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-black rounded-lg uppercase tracking-wider hover:bg-amber-400 transition shrink-0">
              Turn ON in Admin
            </Link>
          </div>
        )}

        {/* Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-3 bg-slate-900/80 border border-white/10 hover:bg-slate-800 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
                <Trophy className="text-amber-400 glow-text-gold" /> LEADERBOARD & STANDINGS
              </h1>
              <p className="text-slate-400 text-sm">Real-time squad standings based on accumulated player points rating.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 rounded-xl text-xs font-mono font-bold uppercase transition shadow-lg"
            >
              <Download size={16} /> Export CSV
            </button>
            <Link
              href="/projector"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-mono font-bold uppercase transition shadow-lg hover:scale-105"
            >
              <Sparkles size={16} /> Live Projector View
            </Link>
          </div>
        </header>

        {/* Futuristic Podium Card Section */}
        {sortedTeams.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
            {/* Rank 2 - Silver */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden order-2 md:order-1 border border-slate-700 shadow-xl"
            >
              <div className="absolute top-0 right-0 p-3 bg-slate-700/40 text-slate-200 rounded-bl-2xl font-black text-xs font-mono">
                RANK #2
              </div>
              <img
                src={getTeamLogo(sortedTeams[1].id, sortedTeams[1].logoUrl)}
                alt={sortedTeams[1].name}
                className="w-16 h-16 object-contain mb-3 p-1.5 bg-black/40 rounded-2xl border border-white/10 drop-shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/Team photos/${sortedTeams[1].id.toLowerCase()}.svg`;
                }}
              />
              <div>
                <h3 className="text-2xl font-black text-white uppercase">{sortedTeams[1].name}</h3>
                <p className="text-xs text-slate-400 mt-1">Owner: {sortedTeams[1].ownerName}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 w-full">
                <span className="text-3xl font-black text-slate-200 font-mono">{sortedTeams[1].totalPoints}</span>
                <span className="text-xs text-slate-500 font-mono block">TOTAL POINTS</span>
              </div>
            </motion.div>

            {/* Rank 1 - Gold Leader */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card glass-card-gold rounded-3xl p-8 flex flex-col justify-between items-center text-center relative overflow-hidden order-1 md:order-2 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/20"
            >
              <div className="absolute top-0 right-0 p-3 bg-amber-500 text-slate-950 rounded-bl-2xl font-black text-xs font-mono">
                LEADER #1
              </div>
              <img
                src={getTeamLogo(sortedTeams[0].id, sortedTeams[0].logoUrl)}
                alt={sortedTeams[0].name}
                className="w-20 h-20 object-contain mb-3 p-2 bg-black/50 rounded-2xl border border-amber-500/40 drop-shadow-xl animate-float"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/Team photos/${sortedTeams[0].id.toLowerCase()}.svg`;
                }}
              />
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">{sortedTeams[0].name}</h3>
                <p className="text-xs text-amber-400 font-medium mt-1">Owner: {sortedTeams[0].ownerName}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-amber-500/40 w-full">
                <span className="text-4xl font-black text-amber-400 glow-text-gold font-mono">{sortedTeams[0].totalPoints}</span>
                <span className="text-xs text-amber-400/80 font-mono block uppercase tracking-widest">TOTAL POINTS</span>
              </div>
            </motion.div>

            {/* Rank 3 - Bronze */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden order-3 border border-amber-900/40 shadow-xl"
            >
              <div className="absolute top-0 right-0 p-3 bg-amber-900/40 text-amber-500 rounded-bl-2xl font-black text-xs font-mono">
                RANK #3
              </div>
              <img
                src={getTeamLogo(sortedTeams[2].id, sortedTeams[2].logoUrl)}
                alt={sortedTeams[2].name}
                className="w-16 h-16 object-contain mb-3 p-1.5 bg-black/40 rounded-2xl border border-white/10 drop-shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/Team photos/${sortedTeams[2].id.toLowerCase()}.svg`;
                }}
              />
              <div>
                <h3 className="text-2xl font-black text-white uppercase">{sortedTeams[2].name}</h3>
                <p className="text-xs text-slate-400 mt-1">Owner: {sortedTeams[2].ownerName}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 w-full">
                <span className="text-3xl font-black text-amber-600 font-mono">{sortedTeams[2].totalPoints}</span>
                <span className="text-xs text-slate-500 font-mono block">TOTAL POINTS</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Glass Table */}
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-amber-400 text-xs font-mono uppercase tracking-widest border-b border-white/10">
                  <th className="p-5 text-center">Rank</th>
                  <th className="p-5">Team Name</th>
                  <th className="p-5 text-center">Squad Size</th>
                  <th className="p-5 text-center">Role Balance</th>
                  <th className="p-5 text-right">Purse Spent</th>
                  <th className="p-5 text-right">Remaining Purse</th>
                  <th className="p-5 text-center">Total Points</th>
                  <th className="p-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {sortedTeams.map((t, index) => {
                  const roleCounts = getSquadRoleCounts(t.id);

                  return (
                    <tr key={t.id} className="hover:bg-amber-500/10 transition-colors duration-200">
                      <td className="p-5 text-center font-black text-slate-400 font-mono text-base">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </td>
                      <td className="p-5 font-black text-white uppercase text-base">
                        <div className="flex items-center gap-3">
                          <img
                            src={getTeamLogo(t.id, t.logoUrl)}
                            alt={t.name}
                            className="w-10 h-10 object-contain rounded-xl p-1 bg-black/40 border border-white/10 shrink-0 drop-shadow"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `/Team photos/${t.id.toLowerCase()}.svg`;
                            }}
                          />
                          <div>
                            <div>{t.name}</div>
                            <div className="text-xs text-slate-400 font-normal lowercase">owner: {t.ownerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-center font-bold font-mono">
                        <span className={`px-3 py-1 rounded-full text-xs ${t.playerCount >= 8 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'}`}>
                          {t.playerCount} / 8
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                          <span title="Batsmen" className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">🏏 {roleCounts.batsmen}</span>
                          <span title="Bowlers" className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/30">⚾ {roleCounts.bowlers}</span>
                          <span title="All-Rounders" className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">⚡ {roleCounts.allRounders}</span>
                          <span title="Wicket Keepers" className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">🧤 {roleCounts.wicketKeepers}</span>
                        </div>
                      </td>
                      <td className="p-5 text-right font-mono font-semibold text-slate-300">
                        {formatCurrency(t.totalSpent)}
                      </td>
                      <td className="p-5 text-right font-mono font-black text-amber-400">
                        {formatCurrency(t.remainingBudget)}
                      </td>
                      <td className="p-5 text-center font-black text-xl text-white font-mono glow-text-gold">
                        {t.totalPoints}
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => setSelectedTeam(t)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold font-mono uppercase inline-flex items-center gap-1.5 transition border border-white/10 shadow-md"
                        >
                          <Eye size={14} /> View Squad
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Squad Inspector Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card glass-card-gold rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative border border-amber-500/40"
            >
              <button
                onClick={() => setSelectedTeam(null)}
                className="absolute top-6 right-6 p-2.5 bg-slate-900 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition border border-white/10"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <Shield className="text-amber-400" size={36} />
                <div>
                  <h3 className="text-2xl font-black text-white uppercase">{selectedTeam.name} Squad</h3>
                  <p className="text-xs text-slate-400 font-mono">Owner: {selectedTeam.ownerName} • Total Rating: {selectedTeam.totalPoints} Points</p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {getTeamSquad(selectedTeam.id).length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm font-mono italic">No players acquired yet.</div>
                ) : (
                  getTeamSquad(selectedTeam.id).map((p) => (
                    <div key={p.id} className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 flex justify-between items-center text-sm">
                      <div>
                        <h4 className="font-bold text-white text-base uppercase">{p.name}</h4>
                        <p className="text-xs text-amber-400 font-mono">{p.role} • {p.points} Points</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">FINAL BID</span>
                        <span className="font-mono text-emerald-400 font-black text-base">{formatCurrency(p.soldPrice || 0)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}