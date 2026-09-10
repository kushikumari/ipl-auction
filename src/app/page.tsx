"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  Tv, 
  BarChart3, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Shield, 
  Star, 
  Award, 
  TrendingUp, 
  Flame, 
  LogOut, 
  User, 
  Lock, 
  Mail, 
  UserCheck, 
  AlertCircle, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { IPL_TEAMS_PRESETS, MARQUEE_INDIAN_PLAYERS } from "@/lib/seedIPL";
import { PlayerRole, Team } from "@/types";
import { subscribeToTeams } from "@/lib/teams";

export default function Home() {
  const { user, userProfile, isAdmin, logout } = useAuth();
  const router = useRouter();

  const [dbTeams, setDbTeams] = useState<Team[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Team Access Verification Form State
  const [selectedTeamId, setSelectedTeamId] = useState<string>("mumbai-indians");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToTeams(setDbTeams);
    return () => unsub();
  }, []);

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
        return { label: "Bowler", icon: "⚡", color: "bg-red-500/20 text-red-300 border-red-500/40" };
      case PlayerRole.ALL_ROUNDER:
        return { label: "All-Rounder", icon: "👑", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      case PlayerRole.WICKET_KEEPER:
        return { label: "Wicket Keeper", icon: "🧤", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
      default:
        return { label: role, icon: "⭐", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  // Handle Team Selection Verification
  const handleVerifyAndAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!selectedTeamId) {
      return setAuthError("Please select a team.");
    }
    if (!memberEmail.trim()) {
      return setAuthError("Please enter your email address.");
    }

    setVerifying(true);

    try {
      const emailToTest = memberEmail.trim().toLowerCase();

      // Find team in database or presets
      const targetTeam = dbTeams.find((t) => t.id === selectedTeamId) || 
        IPL_TEAMS_PRESETS.find((t) => t.id === selectedTeamId);

      if (!targetTeam) {
        throw new Error("Selected team not found.");
      }

      // Admin override always allowed
      if (isAdmin || (user && user.email?.toLowerCase() === emailToTest && emailToTest === "shiva.prasad7266@gmail.com")) {
        setAuthSuccess(`Welcome Admin! Redirecting to ${targetTeam.name}'s private dashboard...`);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`authorized_team_${selectedTeamId}`, emailToTest);
        }
        setTimeout(() => {
          router.push(`/team/${selectedTeamId}`);
        }, 800);
        return;
      }

      // Check registered member emails for this team
      const teamMembers = (targetTeam as Team).members || [];
      const isAuthorized = teamMembers.some(
        (m) => m.email && m.email.toLowerCase().trim() === emailToTest
      );

      if (isAuthorized) {
        setAuthSuccess(`✅ Authorized! Redirecting to ${targetTeam.name}'s dashboard...`);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`authorized_team_${selectedTeamId}`, emailToTest);
        }
        setTimeout(() => {
          router.push(`/team/${selectedTeamId}`);
        }, 1000);
      } else {
        setAuthError("❌ This email is not authorized to access this team.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authorization failed.");
    } finally {
      setVerifying(false);
    }
  };

  // Duplicate the 12 players array to create an infinite seamless loop
  const loopingPlayers = [...MARQUEE_INDIAN_PLAYERS, ...MARQUEE_INDIAN_PLAYERS];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-amber-500/20 via-blue-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-[400px] left-[-100px] w-[500px] h-[500px] bg-purple-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-[-100px] w-[550px] h-[550px] bg-amber-500/15 blur-[140px] pointer-events-none animate-pulse" />

      {/* TOP NAVIGATION BAR */}
      <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 md:px-12 py-3.5 flex justify-between items-center shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3.5"
        >
          <div className="p-2.5 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/30 ring-1 ring-white/20">
            <Trophy className="text-slate-950" size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase flex items-center gap-1.5">
              IPL<span className="text-amber-400 glow-text-gold">AUCTION</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono tracking-normal ml-1">2026</span>
            </h1>
            <p className="text-[10px] text-amber-400/80 font-mono tracking-widest uppercase">College Premier League</p>
          </div>
        </motion.div>

        {/* Right Nav Options */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 md:gap-3"
        >
          <Link
            href="/projector"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/10"
          >
            <Tv size={15} />
            <span className="hidden sm:inline">Live</span> Projector
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-500/10"
          >
            <BarChart3 size={15} />
            <span className="hidden sm:inline">Team</span> Leaderboard
          </Link>

          {/* Admin Control Button */}
          {user && isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/20 border border-emerald-400/50"
            >
              <Shield size={15} />
              <span>Admin Gavel</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="btn-glass-gold px-4 md:px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl border border-amber-400/50 flex items-center gap-1.5 hover:scale-105"
                title="View Full Profile Details"
              >
                <User size={14} />
                <span>{userProfile?.name?.split(" ")[0] || user?.displayName?.split(" ")[0] || "Profile"}</span>
              </Link>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-all hover:scale-105"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-glass-gold px-5 md:px-7 py-2 md:py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl shadow-amber-500/20 border border-amber-400/50 hover:scale-105"
            >
              Sign In
            </Link>
          )}
        </motion.div>
      </nav>

      {/* Hero Header Banner */}
      <section className="max-w-7xl mx-auto flex flex-col items-center justify-center pt-8 pb-4 px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-blue-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold uppercase tracking-widest mb-3 backdrop-blur-md shadow-lg shadow-amber-500/10"
        >
          <Sparkles size={14} className="animate-spin" style={{ animationDuration: '4s' }} /> OFFICIAL COLLEGE IPL AUCTION
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-2 uppercase leading-none bg-clip-text text-transparent bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 glow-text-gold"
        >
          INDIAN PREMIER LEAGUE AUCTION
        </motion.h1>

        <p className="text-sm md:text-base text-slate-300 max-w-2xl font-medium leading-relaxed mb-5">
          Real-time college bidding system. All 10 official franchises, 12 marquee Indian superstars, and live gavel sound effects.
        </p>

        {/* Quick Access Badges */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/auction"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/25 transition-all hover:scale-105"
          >
            <Flame size={16} /> Enter Live Bidding Room
          </Link>
          <Link
            href="/projector"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-indigo-300 font-black text-xs uppercase tracking-wider rounded-xl border border-indigo-500/40 transition-all hover:scale-105 shadow-lg"
          >
            <Tv size={16} /> Stadium Projector View
          </Link>
        </div>
      </section>

      {/* TEAM SELECTION & AUTHORIZED ACCESS CARD */}
      <section className="max-w-4xl mx-auto py-6 px-4 relative z-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card glass-card-gold rounded-3xl p-6 md:p-8 border border-amber-500/40 shadow-2xl relative overflow-hidden bg-slate-900/90 backdrop-blur-2xl"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Lock size={14} /> AUTHORIZED TEAM DASHBOARD ACCESS
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
              SELECT YOUR TEAM &amp; VERIFY EMAIL
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
              Choose your franchise and enter your registered member email address to access your team&apos;s private score, purse, and purchased players.
            </p>
          </div>

          <form onSubmit={handleVerifyAndAccess} className="space-y-5">
            {/* Step 1: Team Selection */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-2 font-bold flex items-center justify-between">
                <span>Step 1: Select Your Team</span>
                <span className="text-amber-400 text-[10px]">10 Official IPL Franchises</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {IPL_TEAMS_PRESETS.map((t) => {
                  const isSelected = selectedTeamId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeamId(t.id);
                        setAuthError(null);
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden ${
                        isSelected
                          ? "border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 scale-[1.02] shadow-lg"
                          : "border-white/10 bg-slate-950/60 hover:border-white/20 hover:bg-slate-900"
                      }`}
                    >
                      <img
                        src={t.logoUrl}
                        alt={t.name}
                        className="w-10 h-10 object-contain drop-shadow"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <span className="text-[11px] font-black uppercase text-white truncate max-w-full leading-tight">
                        {t.shortCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Member Details & Email Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Member Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@gmail.com"
                    value={memberEmail}
                    onChange={(e) => {
                      setMemberEmail(e.target.value);
                      setAuthError(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Authorization Alerts */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 text-xs rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{authError}</span>
              </motion.div>
            )}

            {authSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{authSuccess}</span>
              </motion.div>
            )}

            {/* Step 3: Verify & Submit Button */}
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-xl shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {verifying ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <UserCheck size={18} />
                  <span>Verify Email &amp; Open Team Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </section>

      {/* SECTION 1: ALL 10 OFFICIAL IPL FRANCHISES */}
      <section className="max-w-7xl mx-auto py-8 px-4 md:px-6 relative z-10 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-black uppercase tracking-widest mb-1">
              <Shield size={16} className="text-amber-400" />
              <span>OFFICIAL FRANCHISES (10 TEAMS)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              ALL 10 IPL TEAMS &amp; LOGOS
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">₹ 100 CRORES INITIAL PURSE • 8 PLAYER LIMIT</p>
        </div>

        {/* 10 IPL Teams Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 md:gap-4">
          {IPL_TEAMS_PRESETS.map((team, idx) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              whileHover={{ y: -6, scale: 1.03 }}
              onClick={() => {
                setSelectedTeamId(team.id);
                const selectionElem = document.querySelector('form');
                if (selectionElem) selectionElem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="glass-card glass-card-hover p-4 md:p-5 rounded-2xl border border-white/10 flex flex-col items-center text-center justify-between shadow-xl relative overflow-hidden group cursor-pointer"
              style={{ background: team.bgGradient, borderColor: team.borderColor }}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 mb-3 flex items-center justify-center relative p-1 bg-black/30 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Shield size={36} className="text-amber-400 absolute opacity-20 pointer-events-none" />
              </div>
              <div className="w-full">
                <span className="text-[10px] font-mono text-amber-400 font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-black/60 inline-block mb-1.5 border border-white/10">
                  {team.shortCode}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase leading-tight line-clamp-2">
                  {team.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Owner: {team.ownerName}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 2: 12 MARQUEE INDIAN SUPERSTARS */}
      <section className="py-8 relative z-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-amber-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-black uppercase tracking-widest mb-1">
              <Star size={16} className="text-amber-400 fill-amber-400 animate-pulse" />
              <span>MARQUEE INDIAN PLAYERS • 12 SUPERSTARS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              INDIA&apos;S TOP 12 AUCTION POOL
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 hidden md:inline">
              ✨ Hover to pause loop
            </span>
            <Link
              href="/auction"
              className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
            >
              Live Lot &rarr;
            </Link>
          </div>
        </div>

        {/* Continuous Looping Horizontal Marquee Track */}
        <div 
          className="w-full relative overflow-hidden py-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Edge Blur Masks for Seamless Infinity Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-28 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-28 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />

          {/* Scrolling Container */}
          <motion.div
            className="flex gap-5 w-max"
            animate={{
              x: isPaused ? undefined : ["0%", "-50%"],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 35,
                ease: "linear",
              },
            }}
          >
            {loopingPlayers.map((player, idx) => {
              const roleBadge = getRoleBadge(player.role);
              return (
                <div
                  key={`${player.id}-${idx}`}
                  className="w-[280px] sm:w-[310px] shrink-0 glass-card glass-card-gold rounded-3xl p-5 flex flex-col justify-between border border-amber-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:border-amber-400 transition-all duration-300 group hover:scale-[1.02]"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

                  <div className="flex justify-between items-center mb-3 relative z-10">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${roleBadge.color}`}>
                      <span>{roleBadge.icon}</span>
                      {roleBadge.label}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-mono text-xs font-black shadow-inner">
                      <Award size={13} className="text-amber-400" />
                      {player.points} PTS
                    </span>
                  </div>

                  <div className="relative mb-3 flex justify-center z-10">
                    <div className="relative group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-2xl border-2 border-amber-500/40 shadow-2xl bg-slate-900"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=0f172a&color=f59e0b&size=200&bold=true`;
                        }}
                      />
                      <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-lg font-black text-[9px] shadow-lg border border-amber-300">
                        🇮🇳 IND
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-3 relative z-10">
                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors line-clamp-1">
                      {player.name}
                    </h3>
                    <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-amber-300/90 font-mono text-[10px] font-bold line-clamp-1">
                      <Shield size={11} className="text-amber-400 shrink-0" />
                      <span className="truncate">{player.teamName}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex justify-between items-center relative z-10">
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono block uppercase font-semibold">BASE PRICE</span>
                      <span className="text-xs sm:text-sm font-black text-white font-mono text-amber-300">{formatCurrency(player.basePrice)}</span>
                    </div>
                    <Link
                      href="/auction"
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md group-hover:scale-105"
                    >
                      Bid Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: KEY PLATFORM CAPABILITIES */}
      <section className="max-w-7xl mx-auto py-8 px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10 w-full">
        <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-start gap-4 bg-slate-900/60 backdrop-blur-xl">
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/30">
            <Zap size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white mb-1">Atomic Concurrency Bidding</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Firestore transaction locks prevent bid collisions and synchronize instantaneous bids across all participant screens.</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-start gap-4 bg-slate-900/60 backdrop-blur-xl">
          <div className="p-3 bg-blue-500/15 text-blue-400 rounded-2xl border border-blue-500/30">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white mb-1">Squad &amp; Purse Validation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Strict enforcement of the 8-player squad cap, live remaining purse calculations, and role balance indicators.</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-start gap-4 bg-slate-900/60 backdrop-blur-xl">
          <div className="p-3 bg-purple-500/15 text-purple-400 rounded-2xl border border-purple-500/30">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white mb-1">Live Projector &amp; Sound</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Broadcast-grade visual cards with gavel hammer sound effects, countdown timer, and sold celebrations.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-5 text-center text-xs text-slate-500 font-mono">
        COLLEGE PREMIER LEAGUE IPL AUCTION ENGINE &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
