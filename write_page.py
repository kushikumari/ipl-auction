with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write('''\"use client\";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { subscribeToAuctionState, initializeAuction, startAuction, sellCurrentPlayer, markUnsold, AuctionError } from "@/lib/auction";
import { subscribeToPlayers } from "@/lib/players";
import { subscribeToTeams } from "@/lib/teams";
import { subscribeToTransactions } from "@/lib/transactions";
import { AuctionState, Player, Team, AuctionStatus, PlayerStatus, UserRole, AuctionTransaction } from "@/types";
import { Loader2, Gavel, Users, LogOut, Database, UserPlus, Trophy, Clock, RefreshCw, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [auction, setAuction] = useState<AuctionState | null | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [transactions, setTransactions] = useState<AuctionTransaction[]>([]);
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
    const unsubTxs = subscribeToTransactions(setTransactions);
    return () => { unsubAuction(); unsubPlayers(); unsubTeams(); unsubTxs(); };
  }, []);

  const handleInitialize = async () => {
    setLoading(true); setError(null);
    try { await initializeAuction(); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
with open('src/app/admin/page.tsx', 'a', encoding='utf-8') as f:
    f.write('''  
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

  const handleMarkUnsold = async () => {
    setLoading(true); setError(null);
    try { await markUnsold(); } catch (err: any) { setError(err instanceof AuctionError ? err.code : err.message); } finally { setLoading(false); }
  };

  if (authLoading || auction === undefined) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin text-amber-500" /></div>;
  if (!user || userProfile?.role !== UserRole.ADMIN) return null;

  const availablePlayers = players.filter(p => p.status === PlayerStatus.AVAILABLE);
  const soldPlayers = players.filter(p => p.status === PlayerStatus.SOLD);
  const unsoldPlayers = players.filter(p => p.status === PlayerStatus.UNSOLD);
  
  const totalMoneySpent = teams.reduce((acc, t) => acc + (t.totalSpent || 0), 0);
  const avgSalePrice = soldPlayers.length > 0 ? (totalMoneySpent / soldPlayers.length) : 0;
  
  const highestBid = soldPlayers.reduce((max, p) => (p.soldPrice || 0) > max ? (p.soldPrice || 0) : max, 0);
with open('src/app/admin/page.tsx', 'a', encoding='utf-8') as f:
    f.write('''
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Gavel className="text-amber-500" /> Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Control Center & Live Analytics</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/players" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold">Players</Link>
          <Link href="/admin/teams" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold">Teams</Link>
          <Link href="/admin/manage-admins" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold">Admins</Link>
          <Link href="/leaderboard" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold">Leaderboard</Link>
          <button onClick={() => logout()} className="px-4 py-2 bg-red-950 text-red-300 rounded-xl text-sm font-semibold">Logout</button>
        </div>
      </header>
      
      {error && <div className="p-4 bg-red-900 text-red-200 rounded-xl">{error}</div>}

      <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="text-amber-500" /> Live Analytics</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard label="Total Teams" value={teams.length.toString()} />
          <MetricCard label="Total Players" value={players.length.toString()} />
          <MetricCard label="Players Sold" value={soldPlayers.length.toString()} />
          <MetricCard label="Players Unsold" value={unsoldPlayers.length.toString()} />
          <MetricCard label="Available" value={availablePlayers.length.toString()} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <MetricCard label="Total Spent" value={`₹${totalMoneySpent.toLocaleString()}`} />
          <MetricCard label="Avg Sale" value={`₹${Math.round(avgSalePrice).toLocaleString()}`} />
          <MetricCard label="Highest Sale" value={`₹${highestBid.toLocaleString()}`} />
          <MetricCard label="Top Spending Team" value={highestSpendingTeam ? `${highestSpendingTeam.name} (₹${(highestSpendingTeam.totalSpent || 0).toLocaleString()})` : "N/A"} />
        </div>
      </section>
''')

with open('src/app/admin/page.tsx', 'a', encoding='utf-8') as f:
    f.write('''
      {!auction ? (
        <div className="text-center p-10 bg-slate-900 rounded-2xl border border-slate-800">
          <button onClick={handleInitialize} className="px-6 py-3 bg-amber-600 rounded-xl font-bold">Initialize Auction</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Gavel className="text-amber-500" /> Live Auction Status</h2>
              {auction.status === AuctionStatus.LIVE ? (
                <div className="space-y-4">
                  <p className="text-2xl font-extrabold">{currentPlayer?.name || "Unknown"}</p>
                  <p className="text-sm text-slate-400">Role: {currentPlayer?.role} • Base: ₹{currentPlayer?.basePrice}</p>
                  <p className="text-lg font-bold text-green-400">Current Bid: ₹{auction.currentBid} ({auction.highestBidderTeamName || "No Bids"})</p>
                  <div className="flex gap-4">
                    <button onClick={handleSellPlayer} disabled={loading || !auction.highestBidderTeamId} className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl font-bold">Mark SOLD</button>
                    <button onClick={handleMarkUnsold} disabled={loading} className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl font-bold">Mark UNSOLD</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 italic">No Active Auction</div>
              )}
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="text-amber-500" /> Start Auction</h2>
              {auction.status !== AuctionStatus.LIVE && (
                <form onSubmit={handleStartAuction} className="space-y-4">
                  <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} required className="w-full p-3 bg-slate-800 rounded-xl">
                    <option value="">Select available player...</option>
                    {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.basePrice})</option>)}
                  </select>
                  <button type="submit" disabled={loading} className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold">Start Auction</button>
                </form>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><RefreshCw className="text-amber-500" /> Recent Activity</h2>
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {transactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between text-sm">
                  <div>
                    <p className="font-bold">{tx.playerName}</p>
                    <p className="text-xs text-slate-400">{tx.teamName || "Unsold"} • ₹{tx.finalBid || tx.basePrice}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'SOLD' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>{tx.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
      <p className="text-slate-400 text-xs uppercase font-bold">{label}</p>
      <p className="text-lg font-bold mt-1 text-slate-100">{value}</p>
    </div>
  );
}
''')

  const highestSpendingTeam = [...teams].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0];
  const highestPointsTeam = [...teams].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))[0];

  const currentPlayer = auction?.currentPlayerId ? players.find(p => p.id === auction.currentPlayerId) : null;
''')

''')
