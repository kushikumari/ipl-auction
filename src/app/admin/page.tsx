"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { subscribeToPlayers, createPlayer } from "@/lib/players";
import { subscribeToTeams, createTeam, addTeamMember, removeTeamMember, updateAllTeamsBudget } from "@/lib/teams";
import { IPL_TEAMS_PRESETS, MARQUEE_INDIAN_PLAYERS } from "@/lib/seedIPL";
import { subscribeToGlobalSettings, setLeaderboardVisible, setDefaultPurseBudget } from "@/lib/settings";
import { Player, Team, PlayerStatus, UserRole } from "@/types";
import { 
  Loader2, 
  Shield, 
  Users, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  Mail, 
  ChevronRight, 
  UserCheck, 
  UserPlus, 
  Trash2, 
  AlertCircle, 
  Award, 
  ShoppingBag,
  Tv,
  Trophy,
  Eye,
  EyeOff,
  Coins,
  Wallet,
  Sliders,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, userProfile, isAdmin, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Leaderboard visibility toggle
  const [leaderboardVisible, setLeaderboardVisibleState] = useState<boolean>(false);
  const [togglingLeaderboard, setTogglingLeaderboard] = useState(false);

  // Purse Budget Allocation State
  const [allocatedPurseInCr, setAllocatedPurseInCr] = useState<number>(100);
  const [selectedPurseInCr, setSelectedPurseInCr] = useState<number>(100);
  const [customPurseInput, setCustomPurseInput] = useState<string>("100");
  const [updatingPurse, setUpdatingPurse] = useState<boolean>(false);

  // Email Verification Modal States
  const [isAddEmailModalOpen, setIsAddEmailModalOpen] = useState(false);
  const [selectedTeamIdForEmail, setSelectedTeamIdForEmail] = useState<string>("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [submittingEmail, setSubmittingEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && userProfile?.role !== UserRole.ADMIN))) {
      router.push("/login");
    }
  }, [user, userProfile, isAdmin, authLoading, router]);

  useEffect(() => {
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubSettings = subscribeToGlobalSettings((s) => {
      setLeaderboardVisibleState(s.leaderboardVisible);
      if (s.defaultPurseBudget) {
        const cr = Math.round(s.defaultPurseBudget / 10000000);
        setAllocatedPurseInCr(cr);
        setSelectedPurseInCr(cr);
        setCustomPurseInput(String(cr));
      }
    });
    return () => {
      unsubPlayers();
      unsubTeams();
      unsubSettings();
    };
  }, []);

  const handleToggleLeaderboard = async () => {
    setTogglingLeaderboard(true);
    setError(null);
    try {
      await setLeaderboardVisible(!leaderboardVisible);
      setSuccessMsg(leaderboardVisible ? "Leaderboard hidden from all users." : "Leaderboard is now LIVE and visible to all users!");
    } catch (err: any) {
      setError(err.message || "Failed to update leaderboard visibility.");
    } finally {
      setTogglingLeaderboard(false);
    }
  };

  const handleApplyPurseBudget = async (crAmount?: number) => {
    const val = crAmount !== undefined ? crAmount : Number(customPurseInput);
    if (!val || isNaN(val) || val <= 0) {
      setError("Please enter a valid positive purse budget in Crores (e.g. 100 or 50).");
      return;
    }
    if (!confirm(`Allocate ₹ ${val} Cr bidding purse to all ${teams.length} IPL teams?\n\nEach team's total budget will be set to ₹ ${val} Cr and remaining budgets will automatically recalculate based on their current squad spending.`)) {
      return;
    }
    setUpdatingPurse(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const budgetRupees = val * 10000000;
      await updateAllTeamsBudget(budgetRupees);
      await setDefaultPurseBudget(budgetRupees);
      setAllocatedPurseInCr(val);
      setSelectedPurseInCr(val);
      setCustomPurseInput(String(val));
      setSuccessMsg(`Purse budget successfully updated! All teams now have ₹ ${val} Cr allocated.`);
    } catch (err: any) {
      setError(err.message || "Failed to update team purse budget.");
    } finally {
      setUpdatingPurse(false);
    }
  };

  const handleSeedIPLData = async () => {
    if (!confirm("Seed/reset 10 IPL Teams and 12 Star Indian Players into the database?")) return;
    setSeeding(true);
    setError(null);
    setSuccessMsg(null);
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

      setSuccessMsg("Successfully seeded 10 IPL Teams and 12 Star Players!");
    } catch (err: any) {
      setError("Seeding failed: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleAddApprovedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamIdForEmail || !newMemberName.trim() || !newMemberEmail.trim()) {
      return setError("Please fill in Team, Member Name, and Email address.");
    }
    setSubmittingEmail(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await addTeamMember(selectedTeamIdForEmail, {
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
      });
      const t = teams.find((x) => x.id === selectedTeamIdForEmail);
      setSuccessMsg(`Approved email '${newMemberEmail}' added for team ${t?.name || ""}!`);
      setNewMemberName("");
      setNewMemberEmail("");
      setIsAddEmailModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to add email verification.");
    } finally {
      setSubmittingEmail(false);
    }
  };

  const handleRemoveApprovedEmail = async (teamId: string, memberId: string, email: string) => {
    if (!confirm(`Remove approved email '${email}' from this team?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await removeTeamMember(teamId, memberId);
      setSuccessMsg(`Approved email '${email}' removed.`);
    } catch (err: any) {
      setError(err.message || "Failed to remove email.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  if (!user || (!isAdmin && userProfile?.role !== UserRole.ADMIN)) return null;

  const biddedPlayers = players.filter((p) => p.status === PlayerStatus.SOLD);
  const totalSpent = teams.reduce((acc, t) => acc + (t.totalSpent || 0), 0);

  // Aggregate all registered emails across all teams
  const allVerifiedEmails: { teamId: string; teamName: string; memberId: string; name: string; email: string }[] = [];
  teams.forEach((t) => {
    if (t.members && Array.isArray(t.members)) {
      t.members.forEach((m: any) => {
        allVerifiedEmails.push({
          teamId: t.id,
          teamName: t.name,
          memberId: m.id,
          name: m.name,
          email: m.email,
        });
      });
    }
  });

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3 text-white uppercase tracking-wider">
              <Shield className="text-amber-400 glow-text-gold" size={34} /> ADMIN CONTROL ROOM
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              IPL Team Email Verification, Team Cards &amp; Manual Bidded Player Management.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSeedIPLData}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold uppercase transition shadow-lg hover:scale-105"
            >
              {seeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Seed 10 IPL Teams
            </button>
            <Link
              href="/projector"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-mono font-bold uppercase transition shadow-lg hover:scale-105"
            >
              <Tv size={16} /> Broadcast Display
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase transition shadow-lg"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* System Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">IPL TEAMS</p>
            <h3 className="text-3xl font-black text-white mt-1">{teams.length}</h3>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">APPROVED TEAM EMAILS</p>
            <h3 className="text-3xl font-black text-indigo-300 mt-1">{allVerifiedEmails.length}</h3>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">PLAYERS BIDDED</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">{biddedPlayers.length}</h3>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">TOTAL PURSE SPENT</p>
            <h3 className="text-3xl font-black text-amber-400 font-mono mt-1">{formatCurrency(totalSpent)}</h3>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl flex items-center gap-3 backdrop-blur-md">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-2xl flex items-center gap-3 backdrop-blur-md">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LEADERBOARD VISIBILITY TOGGLE SECTION */}
        <section className={`glass-card p-6 md:p-8 rounded-3xl border shadow-2xl transition-all duration-500 ${
          leaderboardVisible
            ? "border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 to-slate-900"
            : "border-white/10"
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                leaderboardVisible
                  ? "bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-800/60 border-white/10"
              }`}>
                <Trophy size={32} className={leaderboardVisible ? "text-amber-400 glow-text-gold" : "text-slate-400"} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  LEADERBOARD VISIBILITY CONTROL
                  {leaderboardVisible && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold animate-pulse">
                      ● LIVE
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {leaderboardVisible
                    ? "Leaderboard is LIVE — all users can see top rankings right now."
                    : "Leaderboard is HIDDEN — no one except admin can see standings."}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleLeaderboard}
              disabled={togglingLeaderboard}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 min-w-[220px] justify-center ${
                leaderboardVisible
                  ? "bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-300"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/30"
              }`}
            >
              {togglingLeaderboard ? (
                <Loader2 size={20} className="animate-spin" />
              ) : leaderboardVisible ? (
                <><EyeOff size={20} /> Turn OFF Leaderboard</>
              ) : (
                <><Eye size={20} /> Turn ON Leaderboard</>
              )}
            </button>
          </div>

          {leaderboardVisible && (
            <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <CheckCircle2 size={14} />
              Leaderboard is publicly visible. Rankings show Top #1, #2, #3 with full standings. Click &quot;Turn OFF&quot; to hide it instantly.
            </div>
          )}
        </section>

        {/* SECTION: TEAM BIDDING PURSE BUDGET ALLOCATION */}
        <section className="glass-card p-6 md:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6 pb-6 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/20">
                <Coins size={32} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                  TEAM BIDDING PURSE ALLOCATION
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-mono font-bold">
                    ₹ {allocatedPurseInCr} Cr / Team
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Decide and allocate bidding budget per team (e.g., ₹ 100 Cr or ₹ 50 Cr). Existing squad spending is preserved and remaining purse automatically recalculates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-white/10 font-mono text-xs">
              <span className="text-slate-400">Total League Purse:</span>
              <span className="text-amber-400 font-bold text-sm">
                ₹ {(Number(customPurseInput) || selectedPurseInCr) * (teams.length || 10)} Cr
              </span>
              <span className="text-slate-500">({teams.length} Teams)</span>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <label className="text-xs font-mono uppercase text-slate-400 font-bold block mb-3">
                Quick Preset Budget Options:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { cr: 50, label: "₹ 50 Cr", desc: "Economy" },
                  { cr: 75, label: "₹ 75 Cr", desc: "Medium" },
                  { cr: 100, label: "₹ 100 Cr", desc: "Standard IPL" },
                  { cr: 120, label: "₹ 120 Cr", desc: "Mega Auction" },
                  { cr: 150, label: "₹ 150 Cr", desc: "High Stakes" },
                ].map((preset) => (
                  <button
                    key={preset.cr}
                    type="button"
                    onClick={() => {
                      setSelectedPurseInCr(preset.cr);
                      setCustomPurseInput(String(preset.cr));
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center ${
                      selectedPurseInCr === preset.cr
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20 scale-105"
                        : "bg-slate-900/80 text-white border-white/10 hover:border-amber-500/50 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm font-black font-mono">{preset.label}</span>
                    <span className={`text-[10px] font-mono mt-0.5 ${selectedPurseInCr === preset.cr ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                      {preset.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-white/10">
              <div className="w-full sm:w-auto flex-1 flex items-center gap-3">
                <label className="text-xs font-mono uppercase text-slate-400 font-bold whitespace-nowrap">
                  Custom Amount:
                </label>
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customPurseInput}
                    onChange={(e) => {
                      setCustomPurseInput(e.target.value);
                      const num = Number(e.target.value);
                      if (!isNaN(num)) setSelectedPurseInCr(num);
                    }}
                    placeholder="e.g. 50, 100, 120"
                    className="w-full pl-8 pr-28 py-3.5 bg-slate-950 border border-white/20 rounded-2xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400 transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs uppercase font-bold">
                    Crore (Cr)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyPurseBudget()}
                disabled={updatingPurse}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs font-mono uppercase tracking-wider transition-all duration-200 shadow-xl shadow-amber-500/20 hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {updatingPurse ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Updating All Teams...
                  </>
                ) : (
                  <>
                    <Coins size={16} /> Allocate ₹ {customPurseInput || selectedPurseInCr} Cr to All Teams
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 1: TEAM EMAIL VERIFICATION AS APPROVED */}

        <section className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
                <UserCheck className="text-emerald-400" size={26} /> TEAM EMAIL VERIFICATION &amp; APPROVED ACCESS
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Emails registered here are verified &amp; approved to log in to their respective IPL team dashboard.
              </p>
            </div>
            <button
              onClick={() => {
                if (teams.length > 0) setSelectedTeamIdForEmail(teams[0].id);
                setNewMemberName("");
                setNewMemberEmail("");
                setIsAddEmailModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg hover:scale-105"
            >
              <UserPlus size={16} /> Add Approved Team Email
            </button>
          </div>

          {allVerifiedEmails.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-white/5 text-slate-400 text-sm italic font-mono">
              No approved team emails added yet. Click &quot;Add Approved Team Email&quot; above to grant verified access.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-amber-400 text-xs font-mono uppercase tracking-widest border-b border-white/10">
                    <th className="p-4">#</th>
                    <th className="p-4">IPL Team</th>
                    <th className="p-4">Member Name</th>
                    <th className="p-4">Approved Email Address</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {allVerifiedEmails.map((m, idx) => (
                    <tr key={`${m.teamId}-${m.memberId}-${idx}`} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-4 font-bold text-white uppercase">{m.teamName}</td>
                      <td className="p-4 font-semibold text-slate-200">{m.name}</td>
                      <td className="p-4 font-mono text-indigo-300">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                          <Mail size={14} />
                          {m.email}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold uppercase font-mono">
                          <CheckCircle2 size={12} /> Approved &amp; Verified
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleRemoveApprovedEmail(m.teamId, m.memberId, m.email)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-300 rounded-xl transition"
                          title="Remove Approved Email"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION 2: ALL IPL TEAM CARDS */}
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
                <Users className="text-amber-400" size={26} /> IPL TEAM CARDS — SELECT TEAM TO ENTER BIDDED PLAYERS
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Click any team card to open its detail panel where you can manually enter player name, score, and amount bought.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((t, idx) => {
              const memberCount = t.members ? t.members.length : 0;
              const teamPurchasedPlayers = biddedPlayers.filter((p) => p.currentTeamId === t.id);

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                >
                  <Link
                    href={`/admin/teams/${t.id}`}
                    className="glass-card glass-card-hover p-6 rounded-3xl border border-white/10 hover:border-amber-400/60 shadow-xl flex flex-col justify-between block group transition-all duration-300 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90"
                  >
                    {/* Top Header */}
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
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Verified Emails</span>
                        <span className="text-base font-black text-indigo-300 flex items-center gap-1.5 mt-0.5">
                          <UserCheck size={14} className="text-indigo-400" />
                          {memberCount} Approved
                        </span>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Players Bidded</span>
                        <span className="text-base font-black text-emerald-300 flex items-center gap-1.5 mt-0.5">
                          <ShoppingBag size={14} className="text-emerald-400" />
                          {teamPurchasedPlayers.length} Bought
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

                    {/* Footer Row */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-mono uppercase">Total Squad Points</span>
                      <span className="text-lg font-black text-amber-400 glow-text-gold font-mono flex items-center gap-1">
                        <Award size={16} />
                        {t.totalPoints || 0} PTS
                      </span>
                    </div>

                    <div className="mt-3 text-center py-2 bg-amber-500/10 group-hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 font-bold text-xs font-mono uppercase transition">
                      Enter Bidded Players for {t.name} &rarr;
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Add Approved Email Modal */}
      <AnimatePresence>
        {isAddEmailModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card glass-card-gold rounded-3xl max-w-md w-full p-6 sm:p-8 border border-amber-500/40 shadow-2xl relative bg-slate-900"
            >
              <h3 className="text-xl font-black text-white uppercase mb-1">Add Approved Team Email</h3>
              <p className="text-xs text-slate-400 mb-6 font-mono">
                Authorizes an email address to log in to a specific IPL Team Dashboard.
              </p>

              <form onSubmit={handleAddApprovedEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Select IPL Team *</label>
                  <select
                    value={selectedTeamIdForEmail}
                    onChange={(e) => setSelectedTeamIdForEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-semibold"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.id.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Member Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Owner / Captain Name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Approved Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. team.member@gmail.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEmailModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingEmail}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingEmail ? <Loader2 className="animate-spin" size={16} /> : "Save Approved Email"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
