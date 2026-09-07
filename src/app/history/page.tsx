"use client";

import { useState, useEffect } from "react";
import { subscribeToTransactions } from "@/lib/transactions";
import { rollbackTransaction } from "@/lib/auction";
import { useAuth } from "@/context/AuthContext";
import { AuctionTransaction, UserRole } from "@/types";
import { History, ArrowLeft, Search, RotateCcw, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { userProfile } = useAuth();
  const [txs, setTxs] = useState<AuctionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SOLD" | "UNSOLD">("ALL");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToTransactions((data) => {
      setTxs(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleRollback = async (txId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to rollback the transaction for "${playerName}"? Budget and player status will be restored.`)) {
      return;
    }
    setRevertingId(txId);
    setMsg(null);
    try {
      await rollbackTransaction(txId);
      setMsg(`Successfully rolled back transaction for ${playerName}.`);
    } catch (err: any) {
      alert(`Rollback failed: ${err.message}`);
    } finally {
      setRevertingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return "₹ 0";
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString()}`;
  };

  const filtered = txs.filter((tx) => {
    const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesName =
      tx.playerName.toLowerCase().includes(searchLower) ||
      (tx.teamName?.toLowerCase().includes(searchLower) ?? false);
    return matchesStatus && matchesName;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
                <History className="text-amber-400" /> AUCTION TRANSACTION HISTORY
              </h1>
              <p className="text-slate-400 text-sm">Full audit trail of all player lots, sales, unsold events, and transaction rollbacks.</p>
            </div>
          </div>
        </header>

        {msg && (
          <div className="mb-6 p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
            <span className="font-semibold text-sm">{msg}</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search by player or team name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-white font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SOLD">SOLD Lots Only</option>
            <option value="UNSOLD">UNSOLD Lots Only</option>
          </select>
        </div>

        {/* Audit Log Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-amber-500" size={40} />
          </div>
        ) : (
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-amber-400 text-xs font-mono uppercase tracking-widest border-b border-slate-800">
                    <th className="p-5">Player Name</th>
                    <th className="p-5">Buyer Team</th>
                    <th className="p-5 text-right">Base Price</th>
                    <th className="p-5 text-right">Final Hammer Bid</th>
                    <th className="p-5 text-center">Status</th>
                    <th className="p-5">Timestamp</th>
                    {userProfile?.role === UserRole.ADMIN && <th className="p-5 text-center">Admin Audit</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                        No transactions found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((tx) => (
                      <tr key={tx.id} className={`hover:bg-slate-800/40 transition ${tx.reversed ? 'opacity-50 line-through bg-red-950/10' : ''}`}>
                        <td className="p-5 font-extrabold text-white">
                          {tx.playerName}
                          {tx.reversed && <span className="ml-2 text-xs text-red-400 font-mono font-normal">(ROLLED BACK)</span>}
                        </td>
                        <td className="p-5 font-semibold text-slate-300">{tx.teamName || "N/A"}</td>
                        <td className="p-5 text-right font-mono text-slate-400">{formatCurrency(tx.basePrice || 0)}</td>
                        <td className="p-5 text-right font-mono font-extrabold text-amber-400">
                          {tx.status === "SOLD" ? formatCurrency(tx.finalBid) : "N/A"}
                        </td>
                        <td className="p-5 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                              tx.status === "SOLD" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-5 text-slate-400 text-xs font-mono">
                          {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : new Date(tx.timestamp).toLocaleString()}
                        </td>
                        {userProfile?.role === UserRole.ADMIN && (
                          <td className="p-5 text-center">
                            {!tx.reversed ? (
                              <button
                                onClick={() => handleRollback(tx.id, tx.playerName)}
                                disabled={revertingId === tx.id}
                                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition disabled:opacity-40"
                              >
                                {revertingId === tx.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Rollback
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Reverted</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}