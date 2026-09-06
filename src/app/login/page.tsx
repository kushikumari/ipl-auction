"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { login as adminLogin } from "@/lib/auth";
import { Trophy } from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"ADMIN" | "TEAM">("TEAM");
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const result = await adminLogin(email, password);
      router.replace(result.role === "ADMIN" ? "/admin" : "/team");
    } catch (err: any) {
      setError(err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    
    try {
      if (isFirstTime) {
        // Setup Flow
        const res = await fetch("/api/setup-team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamName, setupCode, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }

      // Standard Team Login Flow
      const res = await fetch("/api/login-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, password }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Login failed");

      await signInWithCustomToken(auth, data.customToken);
      router.replace("/team");
    } catch (err: any) {
      setError(err.message || "Team login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 mb-8">
        <Trophy className="text-amber-500" size={40} />
        <h1 className="text-3xl font-bold tracking-tight text-white">College<span className="text-amber-500">Auction</span></h1>
      </div>

      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex mb-6 gap-2 bg-slate-800 p-1 rounded-lg">
          <button className={`flex-1 p-2 rounded ${activeTab === "TEAM" ? "bg-amber-500 text-slate-900 font-bold" : "text-white"}`} onClick={() => setActiveTab("TEAM")}>Team</button>
          <button className={`flex-1 p-2 rounded ${activeTab === "ADMIN" ? "bg-amber-500 text-slate-900 font-bold" : "text-white"}`} onClick={() => setActiveTab("ADMIN")}>Admin</button>
        </div>

        {activeTab === "ADMIN" ? (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input className="block w-full p-3 bg-slate-800 rounded-lg text-white" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="block w-full p-3 bg-slate-800 rounded-lg text-white" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="w-full p-3 bg-amber-500 rounded-lg font-bold" disabled={loading}>{loading ? "Signing In..." : "Login"}</button>
          </form>
        ) : (
          <form onSubmit={handleTeamLogin} className="space-y-4">
            <input className="block w-full p-3 bg-slate-800 rounded-lg text-white" placeholder="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} required />
            <input className="block w-full p-3 bg-slate-800 rounded-lg text-white" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            
            <label className="flex items-center gap-2 text-white text-sm">
              <input type="checkbox" checked={isFirstTime} onChange={e => setIsFirstTime(e.target.checked)} />
              First-time setup?
            </label>
            
            {isFirstTime && (
              <input className="block w-full p-3 bg-slate-800 rounded-lg text-white" placeholder="Setup Code" value={setupCode} onChange={e => setSetupCode(e.target.value)} required />
            )}
            
            <button className="w-full p-3 bg-amber-500 rounded-lg font-bold" disabled={loading}>{loading ? "Processing..." : (isFirstTime ? "Register Team" : "Enter Auction")}</button>
          </form>
        )}
        {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
