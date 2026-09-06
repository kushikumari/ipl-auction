"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { subscribeToAuctionState, initializeAuction, startAuction, sellCurrentPlayer, AuctionError } from "@/lib/auction";
import { subscribeToPlayers } from "@/lib/players";
import { subscribeToTeams } from "@/lib/teams";
import { AuctionState, Player, Team, AuctionStatus, PlayerStatus, UserRole } from "@/types";
import { Loader2, Gavel, Users, LogOut, Database, UserPlus, Trophy, Clock, RefreshCw, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [auction, setAuction] = useState<AuctionState | null | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleStartAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return alert("Select a player");
    setLoading(true); setError(null);
    try {
      await startAuction(selectedPlayerId);
      setSelectedPlayerId("");
    } catch (err: any) { setError(err instanceof AuctionError ? err.code : err.message); } finally { setLoading(false); }
  };

  const handleSellPlayer = async () => {
    setLoading(true); setError(null);
    try { await sellCurrentPlayer(); } catch (err: any) { setError(err instanceof AuctionError ? err.code : err.message); } finally { setLoading(false); }
  };

  if (authLoading || auction === undefined) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin text-amber-500" /></div>;
  if (!user || userProfile?.role !== UserRole.ADMIN) return null;

  const availablePlayers = players.filter(p => p.status === PlayerStatus.AVAILABLE);
  const soldPlayers = players.filter(p => p.status === PlayerStatus.SOLD);
  const totalSpent = teams.reduce((acc, t) => acc + t.totalSpent, 0);
  const livePlayer = players.find(p => p.id === auction?.currentPlayerId);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Gavel className="text-amber-500" /> Admin Dashboard</h1>
          <p className="text-slate-400">Manage your tournament auction seamlessly.</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition"><LogOut size={18} /> Logout</button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">Teams Registered</p>
          <h3 className="text-3xl font-bold">{teams.length}</h3>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">Players Sold</p>
          <h3 className="text-3xl font-bold text-green-500">{soldPlayers.length}</h3>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">Total Spent</p>
          <h3 className="text-3xl font-bold text-amber-500">₹{totalSpent.toLocaleString()}</h3>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">Active Auction</p>
          <h3 className="text-xl font-bold text-green-500">{auction?.status || 'IDLE'}</h3>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
        <Link href="/admin/teams" className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-amber-600 transition flex flex-col items-center gap-2">
            <Users size={24} /> Manage Teams
        </Link>
        <Link href="/admin/players" className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-amber-600 transition flex flex-col items-center gap-2">
            <UserPlus size={24} /> Manage Players
        </Link>
        <Link href="/auction" className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-amber-600 transition flex flex-col items-center gap-2">
            <Gavel size={24} /> Live Auction Room
        </Link>
        <Link href="/admin/manage-admins" className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-amber-600 transition flex flex-col items-center gap-2">
            <Database size={24} /> Manage Admins
        </Link>
        <Link href="/leaderboard" className="p-4 bg-amber-600 rounded-2xl flex flex-col items-center gap-2 font-bold">
            <BarChart3 size={24} /> Leaderboard
        </Link>
      </div>

      {error && <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-400 rounded-xl">{error}</div>}

      {/* Auction Controller */}
      {auction === null ? (
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center">
          <Database className="mx-auto text-slate-600 mb-4" size={48} />
          <h2 className="text-xl font-bold mb-4">Auction record missing</h2>
          <button onClick={handleInitialize} disabled={loading} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold">
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} className="inline mr-2" />} Initialize Auction Document
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Trophy className="text-amber-500" /> Auction Control</h2>
            <div className="space-y-4">
              <p>Current Status: <span className="font-bold text-amber-500">{auction.status}</span></p>
              <p>Player: <span className="font-bold">{livePlayer?.name || "None"}</span></p>
              <p>Highest Bid: <span className="font-bold text-green-500">₹{auction.currentBid}</span> ({auction.highestBidderTeamName || "None"})</p>
              {auction.status === AuctionStatus.LIVE && (
                <button onClick={handleSellPlayer} disabled={loading || !auction.highestBidderTeamId} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold">Mark Player SOLD</button>
              )}
            </div>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="text-amber-500" /> Start Bidding</h2>
            {auction.status === AuctionStatus.LIVE ? <p className="text-slate-400">Auction already live.</p> : (
              <form onSubmit={handleStartAuction} className="space-y-4">
                <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} required className="w-full p-3 bg-slate-800 border rounded-xl">
                  <option value="">Select a player</option>
                  {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name} (Base: ₹{p.basePrice})</option>)}
                </select>
                <button type="submit" disabled={loading} className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold">Start Auction</button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
