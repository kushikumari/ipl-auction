"use client";
import { useState, useEffect } from "react";
import { subscribeToTransactions } from "@/lib/transactions";
import { AuctionTransaction } from "@/types";

export default function HistoryPage() {
  const [txs, setTxs] = useState<AuctionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SOLD" | "UNSOLD">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeToTransactions((data) => {
      setTxs(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = txs.filter(tx => {
    const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesName = tx.playerName.toLowerCase().includes(searchLower) || (tx.teamName?.toLowerCase().includes(searchLower) ?? false);
    return matchesStatus && matchesName;
  });

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Auction History</h1>
      <div className="mb-6 flex gap-4">
        <input placeholder="Search player/team..." value={search} onChange={e => setSearch(e.target.value)} className="p-2 bg-slate-800 border rounded flex-1" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 bg-slate-800 border rounded">
          <option value="ALL">All Statuses</option>
          <option value="SOLD">SOLD</option>
          <option value="UNSOLD">UNSOLD</option>
        </select>
      </div>

      <table className="w-full text-left border-collapse border border-slate-800">
        <thead><tr className="bg-slate-900 text-amber-500">
          <th className="p-4">Player</th><th className="p-4">Team</th>
          <th className="p-4">Final Bid</th><th className="p-4">Status</th>
          <th className="p-4">Timestamp</th>
        </tr></thead>
        <tbody>
          {filtered.map((tx) => (
            <tr key={tx.id} className="border-b border-slate-800">
              <td className="p-4 font-bold">{tx.playerName}</td>
              <td className="p-4">{tx.teamName || "N/A"}</td>
              <td className="p-4">₹{tx.finalBid}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs ${tx.status === "SOLD" ? "bg-green-800" : "bg-red-800"}`}>{tx.status}</span>
              </td>
              <td className="p-4 text-slate-400 text-sm">{tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}