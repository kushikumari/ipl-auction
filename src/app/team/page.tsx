"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/types";
import { Gavel, LogOut, Trophy, BarChart3, Users, DollarSign } from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
  const { user, userProfile, team, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== UserRole.TEAM)) {
      router.push("/login");
    }
  }, [user, userProfile, loading, router]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user || userProfile?.role !== UserRole.TEAM) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
            <Trophy className="text-amber-500" size={32} />
            <h1 className="text-3xl font-bold">{team?.name || "Team Dashboard"}</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <DollarSign className="text-amber-500 mb-4" size={32} />
            <h3 className="text-sm text-slate-400">Remaining Budget</h3>
            <p className="text-3xl font-bold">₹{team?.remainingBudget ?? 0}</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <Users className="text-amber-500 mb-4" size={32} />
            <h3 className="text-sm text-slate-400">Players Count</h3>
            <p className="text-3xl font-bold">{team?.playerCount ?? 0} / 8</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <BarChart3 className="text-amber-500 mb-4" size={32} />
            <h3 className="text-sm text-slate-400">Total Points</h3>
            <p className="text-3xl font-bold">{team?.totalPoints ?? 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Link href="/auction" className="p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-amber-600 transition flex items-center gap-6 group">
          <Gavel className="text-amber-500" size={48} />
          <div>
            <h2 className="text-2xl font-bold mb-2">Live Auction Room</h2>
            <p className="text-slate-400">Join the live auction to place your bids and build your squad.</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
