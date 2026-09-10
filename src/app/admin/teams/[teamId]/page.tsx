"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  subscribeToTeam, 
  subscribeToTeamMembers, 
  addTeamMember, 
  updateTeamMember, 
  removeTeamMember,
  addBiddedPlayerToTeam,
  removeBiddedPlayerFromTeam,
  updateSingleTeamBudget
} from "@/lib/teams";
import { subscribeToPlayers } from "@/lib/players";
import { getTeamLogo } from "@/lib/teamLogos";
import { Team, Player, Member, PlayerStatus, PlayerRole } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  Shield, 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Award, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Mail, 
  User as UserIcon,
  PlusCircle,
  Plus,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTeamDetailPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();
  const { user, userProfile, isAdmin, loading: authLoading } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Budget Modal States
  const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
  const [editingBudgetInCr, setEditingBudgetInCr] = useState<string>("100");
  const [submittingBudget, setSubmittingBudget] = useState(false);

  // Member Modal States
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [submittingMember, setSubmittingMember] = useState(false);

  // Bidded Player Form States (Manual Player Entry)
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState<PlayerRole>(PlayerRole.ALL_ROUNDER);
  const [playerPoints, setPlayerPoints] = useState<string>("90");
  const [playerSoldPrice, setPlayerSoldPrice] = useState<string>("10000000"); // 1 Cr default
  const [submittingPlayer, setSubmittingPlayer] = useState(false);

  // Alerts
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && userProfile?.role !== "ADMIN"))) {
      router.push("/login");
    }
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
  }, [teamId, user, userProfile, isAdmin, authLoading, router]);

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString()}`;
  };

  // Purchased / Bidded Players for this specific team
  const purchasedPlayers = players.filter(
    (p) => p.currentTeamId === teamId && p.status === PlayerStatus.SOLD
  );

  // Totals calculations
  const calculatedSpent = purchasedPlayers.reduce((acc, p) => acc + (p.soldPrice || 0), 0);
  const calculatedPoints = purchasedPlayers.reduce((acc, p) => acc + (p.points || 0), 0);
  const initialBudget = team?.initialBudget || 100000000;
  const calculatedRemaining = Math.max(0, initialBudget - calculatedSpent);

  // Handler: Add Member Email
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) {
      return setError("Please provide both name and email address.");
    }
    setSubmittingMember(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await addTeamMember(teamId, {
        name: memberName.trim(),
        email: memberEmail.trim().toLowerCase(),
      });
      setSuccessMsg(`Approved email '${memberEmail}' added for ${memberName}!`);
      setMemberName("");
      setMemberEmail("");
      setIsAddMemberModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to add team member.");
    } finally {
      setSubmittingMember(false);
    }
  };

  // Handler: Edit Member Email
  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !memberName.trim() || !memberEmail.trim()) return;
    setSubmittingMember(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateTeamMember(teamId, editingMember.id, {
        name: memberName.trim(),
        email: memberEmail.trim().toLowerCase(),
      });
      setSuccessMsg(`Updated details for member ${memberName}!`);
      setEditingMember(null);
      setMemberName("");
      setMemberEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to update member.");
    } finally {
      setSubmittingMember(false);
    }
  };

  // Handler: Delete Member Email
  const handleDeleteMember = async (member: Member) => {
    if (!confirm(`Are you sure you want to remove ${member.name} (${member.email}) from ${team?.name}?`)) {
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      await removeTeamMember(teamId, member.id);
      setSuccessMsg(`Member ${member.name} removed successfully.`);
    } catch (err: any) {
      setError(err.message || "Failed to delete team member.");
    }
  };

  // Handler: Add Bidded Player (Player Name, Score, Amount Bought)
  const handleAddBiddedPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return setError("Please enter player name.");
    const priceNum = Number(playerSoldPrice);
    const pointsNum = Number(playerPoints);

    if (isNaN(priceNum) || priceNum < 0) return setError("Please enter a valid amount bought.");
    if (isNaN(pointsNum) || pointsNum < 0) return setError("Please enter valid points/score.");
    if (priceNum > calculatedRemaining) {
      return setError(`Amount bought (${formatCurrency(priceNum)}) exceeds remaining purse (${formatCurrency(calculatedRemaining)}).`);
    }

    setSubmittingPlayer(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await addBiddedPlayerToTeam(teamId, {
        name: playerName.trim(),
        role: playerRole,
        points: pointsNum,
        soldPrice: priceNum,
      });

      setSuccessMsg(`Successfully added player '${playerName}' to ${team?.name} for ${formatCurrency(priceNum)} (${pointsNum} PTS)!`);
      setPlayerName("");
      setPlayerPoints("90");
      setPlayerSoldPrice("10000000");
    } catch (err: any) {
      setError(err.message || "Failed to add bidded player.");
    } finally {
      setSubmittingPlayer(false);
    }
  };

  // Handler: Remove Bidded Player
  const handleRemoveBiddedPlayer = async (player: Player) => {
    if (!confirm(`Remove player '${player.name}' from ${team?.name}? This will refund ${formatCurrency(player.soldPrice || 0)} to purse.`)) {
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      await removeBiddedPlayerFromTeam(player.id, teamId);
      setSuccessMsg(`Player '${player.name}' removed from ${team?.name}. Purse restored.`);
    } catch (err: any) {
      setError(err.message || "Failed to remove player.");
    }
  };

  const handleUpdateTeamBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(editingBudgetInCr);
    if (!val || isNaN(val) || val <= 0) {
      return setError("Please enter a valid positive budget in Crores (e.g. 50 or 100).");
    }
    setSubmittingBudget(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateSingleTeamBudget(teamId, val * 10000000);
      setSuccessMsg(`Purse budget for ${team?.name} updated to ₹ ${val} Cr.`);
      setIsEditBudgetModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to update team budget.");
    } finally {
      setSubmittingBudget(false);
    }
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setMemberName(m.name);
    setMemberEmail(m.email);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
        <Link href="/admin" className="btn-glass-gold px-6 py-2 rounded-xl text-xs uppercase font-bold">
          Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
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
                <h1 className="text-3xl font-black text-white uppercase tracking-wider">{team.name}</h1>
              </div>
              <p className="text-slate-400 text-sm mt-1">Admin Panel • Enter bidded players, manage purse &amp; email access.</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingMember(null);
              setMemberName("");
              setMemberEmail("");
              setIsAddMemberModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
          >
            <UserPlus size={16} /> Add Verified Team Email
          </button>
        </header>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SECTION 1: Team Financial & Squad Overview */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3 font-semibold">FINANCIAL &amp; SQUAD OVERVIEW</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase">VERIFIED EMAILS</span>
              <h4 className="text-2xl font-black text-indigo-300 mt-1">{members.length}</h4>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-xl relative group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-mono uppercase">TOTAL PURSE</span>
                <button
                  type="button"
                  onClick={() => {
                    const inCr = Math.round(initialBudget / 10000000);
                    setEditingBudgetInCr(String(inCr));
                    setIsEditBudgetModalOpen(true);
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 transition"
                  title="Adjust team purse"
                >
                  <Edit3 size={11} /> Edit
                </button>
              </div>
              <h4 className="text-lg font-black text-white font-mono mt-1">{formatCurrency(initialBudget)}</h4>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase">AMOUNT SPENT</span>
              <h4 className="text-lg font-black text-amber-300 font-mono mt-1">{formatCurrency(calculatedSpent)}</h4>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase">REMAINING PURSE</span>
              <h4 className="text-lg font-black text-amber-400 font-mono mt-1">{formatCurrency(calculatedRemaining)}</h4>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase">PLAYERS BOUGHT</span>
              <h4 className="text-2xl font-black text-emerald-400 mt-1">{purchasedPlayers.length} / 8</h4>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase">TOTAL POINTS</span>
              <h4 className="text-2xl font-black text-amber-400 glow-text-gold font-mono mt-1">{calculatedPoints}</h4>
            </div>
          </div>
        </section>

        {/* SECTION 2: ENTER BIDDED PLAYER DETAILS (NEW REQUESTED FEATURE) */}
        <section className="glass-card p-6 md:p-8 rounded-3xl border border-amber-500/30 shadow-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
          <div className="mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
              <PlusCircle className="text-amber-400 glow-text-gold" size={26} /> ENTER BIDDED PLAYER FOR {team.name.toUpperCase()}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Admin can enter the player name, score/points, and amount bought to assign them to {team.name}.
            </p>
          </div>

          <form onSubmit={handleAddBiddedPlayer} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Player Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jasprit Bumrah"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Role *</label>
              <select
                value={playerRole}
                onChange={(e) => setPlayerRole(e.target.value as PlayerRole)}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-semibold"
              >
                <option value={PlayerRole.BATSMAN}>BATSMAN</option>
                <option value={PlayerRole.BOWLER}>BOWLER</option>
                <option value={PlayerRole.ALL_ROUNDER}>ALL ROUNDER</option>
                <option value={PlayerRole.WICKET_KEEPER}>WICKET KEEPER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Score / Points *</label>
              <input
                type="number"
                required
                min="0"
                max="200"
                placeholder="e.g. 95"
                value={playerPoints}
                onChange={(e) => setPlayerPoints(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Amount Bought (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="100000"
                placeholder="e.g. 15000000 (1.5 Cr)"
                value={playerSoldPrice}
                onChange={(e) => setPlayerSoldPrice(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-semibold font-mono"
              />
              <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                Formatted: {formatCurrency(Number(playerSoldPrice) || 0)}
              </span>
            </div>

            <div className="md:col-span-4 mt-2">
              <button
                type="submit"
                disabled={submittingPlayer}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {submittingPlayer ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Add Bidded Player to {team.name}</>}
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 3: Purchased / Bidded Players Record Table */}
        <section className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <ShoppingBag className="text-amber-400" /> {team.name} — BIDDED PLAYERS LIST
              </h2>
              <p className="text-xs text-slate-400 mt-1">All players currently bought by {team.name}.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              {purchasedPlayers.length} Players Acquired
            </span>
          </div>

          {purchasedPlayers.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-white/5 text-slate-400 text-sm italic font-mono">
              No players bidded/bought for {team.name} yet. Use the form above to add bidded players.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-amber-400 text-xs font-mono uppercase tracking-widest border-b border-white/10">
                      <th className="p-4">#</th>
                      <th className="p-4">Player Name</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-center">Score / Points</th>
                      <th className="p-4 text-right">Amount Bought</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-mono">
                    {purchasedPlayers.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-amber-500/10 transition-colors">
                        <td className="p-4 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-4 font-bold text-white font-sans uppercase">{p.name}</td>
                        <td className="p-4 text-slate-300 text-xs">{p.role}</td>
                        <td className="p-4 text-center font-black text-white text-base glow-text-gold">{p.points} PTS</td>
                        <td className="p-4 text-right font-black text-amber-400">{formatCurrency(p.soldPrice || 0)}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRemoveBiddedPlayer(p)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-300 rounded-xl transition"
                            title="Remove Player"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary Bar */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-amber-500/30 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-xs font-mono text-slate-400">
                  <span className="text-white font-bold uppercase block text-sm">TOTAL SQUAD METRICS FOR {team.name}</span>
                  Real-time synchronization with live auction &amp; admin entries.
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">TOTAL SPENT</span>
                    <span className="text-lg font-black text-amber-300">{formatCurrency(calculatedSpent)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">REMAINING PURSE</span>
                    <span className="text-lg font-black text-amber-400">{formatCurrency(calculatedRemaining)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">TOTAL POINTS</span>
                    <span className="text-xl font-black text-white glow-text-gold">{calculatedPoints} PTS</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: Team Members / Email Verification Section */}
        <section className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <Users className="text-amber-400" /> REGISTERED TEAM MEMBERS &amp; VERIFIED EMAILS
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Authorized user email addresses for {team.name}.
              </p>
            </div>

            <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full font-bold">
              {members.length} Registered
            </span>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-white/5 text-slate-400 text-sm">
              No members configured for this team yet. Click &quot;Add Verified Team Email&quot; above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-amber-400 text-xs font-mono uppercase tracking-widest border-b border-white/10">
                    <th className="p-4">#</th>
                    <th className="p-4">Member Name</th>
                    <th className="p-4">Authorized Email Address</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {members.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-amber-500/10 transition-colors">
                      <td className="p-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-4 font-bold text-white uppercase flex items-center gap-2">
                        <UserIcon size={16} className="text-amber-400" />
                        {m.name}
                      </td>
                      <td className="p-4 font-mono text-amber-300 font-semibold">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <Mail size={14} />
                          {m.email}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold font-mono">
                          <CheckCircle2 size={12} /> Approved
                        </span>
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/40 text-blue-300 rounded-xl transition"
                          title="Edit Member"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(m)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-300 rounded-xl transition"
                          title="Remove Member"
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
      </div>

      {/* Add / Edit Member Modal */}
      <AnimatePresence>
        {(isAddMemberModalOpen || editingMember) && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card glass-card-gold rounded-3xl max-w-md w-full p-6 sm:p-8 border border-amber-500/40 shadow-2xl relative bg-slate-900"
            >
              <button
                onClick={() => {
                  setIsAddMemberModalOpen(false);
                  setEditingMember(null);
                }}
                className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-black text-white uppercase mb-1">
                {editingMember ? "Edit Team Member Email" : `Add Verified Email to ${team.name}`}
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-mono">
                The entered email controls authorization to view {team.name}&apos;s private dashboard.
              </p>

              <form onSubmit={editingMember ? handleEditMember : handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Member Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Authorized Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@gmail.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMemberModalOpen(false);
                      setEditingMember(null);
                    }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingMember}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingMember ? <Loader2 className="animate-spin" size={16} /> : editingMember ? "Save Changes" : "Save Email"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Purse Budget Modal */}
        {isEditBudgetModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card glass-card-gold rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-amber-500/40"
            >
              <button
                onClick={() => setIsEditBudgetModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Coins size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase">Adjust Team Purse</h3>
                  <p className="text-xs text-slate-400 font-mono">Team: {team?.name}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateTeamBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Purse Budget Allocation (in Crore) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="e.g. 50, 100, 120"
                      value={editingBudgetInCr}
                      onChange={(e) => setEditingBudgetInCr(e.target.value)}
                      className="w-full pl-8 pr-28 py-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs uppercase font-bold">
                      Crore (Cr)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 text-xs font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Already Spent:</span>
                    <span className="text-amber-300 font-bold">{formatCurrency(calculatedSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Remaining Purse:</span>
                    <span className="text-amber-400 font-bold">
                      {formatCurrency(Math.max(0, (Number(editingBudgetInCr) || 0) * 10000000 - calculatedSpent))}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditBudgetModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingBudget}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingBudget ? <Loader2 className="animate-spin" size={16} /> : "Update Budget"}
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
