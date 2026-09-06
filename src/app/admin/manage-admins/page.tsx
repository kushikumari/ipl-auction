"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRole, UserProfile } from "@/types";
import { Loader2, Plus, ArrowLeft, ShieldCheck, UserCheck } from "lucide-react";
import Link from "next/link";

export default function ManageAdminsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!userProfile || userProfile.role !== UserRole.ADMIN)) {
      router.push("/login");
    }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    if (userProfile?.role === UserRole.ADMIN) {
      const q = query(collection(db, "users"), where("role", "==", "ADMIN"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAdmins(snapshot.docs.map(doc => doc.data() as UserProfile));
      });
      return () => unsubscribe();
    }
  }, [userProfile]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("Session expired or user not logged in.");
      setLoading(false);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/create-admin", {
        method: "POST",
        body: JSON.stringify({ 
          email: newEmail.trim(), 
          password: newPassword, 
        }),
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create admin");

      setSuccess(`Admin account for ${newEmail} created!`);
      setNewEmail("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  if (!userProfile || userProfile.role !== UserRole.ADMIN) return null;

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white max-w-5xl mx-auto">
      <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition mb-6">
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="text-amber-500" size={32} /> Admin Management
        </h1>
        <p className="text-slate-400 mt-1">Provision and view tournament administrator accounts.</p>
      </header>

      {error && <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-400 rounded-xl">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-xl">{success}</div>}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="text-amber-500" size={20} /> Add New Admin
          </h2>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input type="email" placeholder="admin@ipl.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Temporary Password</label>
              <input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Provision Admin"}
            </button>
          </form>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <UserCheck className="text-green-500" size={20} /> Existing Administrators ({admins.length})
          </h2>
          <div className="space-y-3">
            {admins.map((a) => (
              <div key={a.uid} className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">{a.email}</div>
                  <div className="text-xs text-slate-400 font-mono">UID: {a.uid}</div>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-full">
                  {a.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}