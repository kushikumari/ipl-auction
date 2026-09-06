"use client";

import Link from "next/link";
import { Trophy, Users, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/types";

export default function Home() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user && userProfile) {
      router.replace(userProfile.role === UserRole.ADMIN ? "/admin" : "/team");
    } else if (!user) {
      // Stay on home if not logged in, or optionally redirect to login
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-500" size={32} />
          <h1 className="text-2xl font-bold tracking-tight">College<span className="text-amber-500">Auction</span></h1>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition">
            Login
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-600">
          The Ultimate Cricket Auction
        </h2>
        <p className="text-xl text-slate-400 mb-12 max-w-2xl">
          Real-time, fair, and professional auction platform designed for college cricket tournaments.
        </p>
        <Link 
          href="/login" 
          className="group flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-full text-lg transition-all hover:scale-105"
        >
          Enter Auction Room
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      <section className="max-w-6xl mx-auto py-24 grid md:grid-cols-3 gap-8 px-6">
        <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800">
          <ShieldCheck className="text-amber-500 mb-4" size={40} />
          <h3 className="text-xl font-bold mb-2">Fair Play</h3>
          <p className="text-slate-400">Atomic Firestore transactions ensure every bid is valid and synchronized.</p>
        </div>
        <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800">
          <Users className="text-amber-500 mb-4" size={40} />
          <h3 className="text-xl font-bold mb-2">Real-time</h3>
          <p className="text-slate-400">Live updates keep all teams in sync with the auction progress.</p>
        </div>
        <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800">
          <Trophy className="text-amber-500 mb-4" size={40} />
          <h3 className="text-xl font-bold mb-2">Professional</h3>
          <p className="text-slate-400">Dedicated dashboard for admins and team managers.</p>
        </div>
      </section>
    </main>
  );
}
