"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { updateUser } from "@/lib/users";
import { IPL_TEAMS_PRESETS } from "@/lib/seedIPL";
import { Trophy, ArrowLeft, User, Mail, Phone, GraduationCap, Building2, Shield, Award, Edit3, Save, CheckCircle, LogOut, Sparkles, Flame, ShieldAlert, Key } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, userProfile, isAdmin, refreshProfile, logout } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [favTeam, setFavTeam] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || user?.displayName || "");
      setPhone(userProfile.phone || "");
      setYear(userProfile.year || "3rd Year");
      setBranch(userProfile.branch || "Computer Science & Eng (CSE)");
      setCollegeId(userProfile.collegeId || "");
      setFavTeam(userProfile.favTeam || "Royal Challengers Bengaluru");
    }
  }, [userProfile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      await updateUser(user.uid, {
        name,
        phone,
        year,
        branch,
        collegeId,
        favTeam,
      });
      await refreshProfile();
      setSuccessMsg("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedTeamPreset = IPL_TEAMS_PRESETS.find(
    (t) => t.name.toLowerCase() === (favTeam || userProfile?.favTeam || "").toLowerCase()
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-amber-500/20 via-blue-600/15 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-purple-600/15 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-6 md:px-12 py-4 flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-md"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-500/25">
            <Trophy className="text-slate-950" size={20} />
          </div>
          <span className="text-lg font-black tracking-widest text-white uppercase">
            IPL<span className="text-amber-400">AUCTION</span>
          </span>
        </Link>
      </header>

      {/* Main Profile Details Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 z-10 my-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card glass-card-gold rounded-3xl p-6 sm:p-8 md:p-10 border border-amber-500/30 shadow-2xl bg-slate-900/90 backdrop-blur-2xl relative overflow-hidden"
        >
          {/* Top Banner & Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-1 flex items-center justify-center shadow-xl shadow-amber-500/25 ring-2 ring-white/20">
                  <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center font-black text-2xl text-amber-400">
                    {(userProfile?.name || user?.displayName || "U").charAt(0).toUpperCase()}
                  </div>
                </div>
                {isAdmin && (
                  <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-500 text-slate-950 rounded-md font-black text-[9px] shadow-lg border border-amber-300 flex items-center gap-1">
                    <ShieldAlert size={10} /> ADMIN
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {userProfile?.name || user?.displayName || "Participant Profile"}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    isAdmin 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                      : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  }`}>
                    {isAdmin ? "👑 Super Admin" : "🎓 College Participant"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                  <Mail size={12} className="text-slate-500" />
                  {user?.email || "No email available"}
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Key size={14} /> Admin Gavel Room
                </Link>
              )}

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
              >
                <Edit3 size={14} />
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              {successMsg}
            </motion.div>
          )}

          {/* Details Content (Edit Mode vs Display Mode) */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Mobile / WhatsApp Number</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                {/* College Year */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">College Year</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="1st Year">1st Year (Freshman)</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                    <option value="Postgraduate / Faculty">Postgraduate / Faculty</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Department / Branch</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    <option value="Computer Science & Eng (CSE)">Computer Science & Eng (CSE)</option>
                    <option value="Information Technology (IT)">Information Technology (IT)</option>
                    <option value="Electronics & Comm (ECE)">Electronics & Comm (ECE)</option>
                    <option value="Electrical Engineering (EE)">Electrical Engineering (EE)</option>
                    <option value="Mechanical Engineering (ME)">Mechanical Engineering (ME)</option>
                    <option value="Civil Engineering (CE)">Civil Engineering (CE)</option>
                    <option value="Artificial Intelligence & DS">Artificial Intelligence & DS</option>
                    <option value="Management / BBA / MBA">Management / BBA / MBA</option>
                  </select>
                </div>

                {/* College Roll ID */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">College Roll ID</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                  />
                </div>

                {/* Favorite IPL Team */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Favorite IPL Team</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                    value={favTeam}
                    onChange={(e) => setFavTeam(e.target.value)}
                  >
                    {IPL_TEAMS_PRESETS.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.shortCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          ) : (
            /* DISPLAY DETAILS GRID */
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Full Name */}
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Full Name</span>
                  <p className="text-base font-bold text-white flex items-center gap-2">
                    <User size={16} className="text-amber-400" />
                    {userProfile?.name || user?.displayName || "Not Specified"}
                  </p>
                </div>

                {/* Email Address */}
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Email Address</span>
                  <p className="text-sm font-bold text-white truncate flex items-center gap-2">
                    <Mail size={16} className="text-amber-400 shrink-0" />
                    {user?.email || "Not Available"}
                  </p>
                </div>

                {/* Phone Number */}
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Mobile / WhatsApp</span>
                  <p className="text-base font-bold text-white flex items-center gap-2">
                    <Phone size={16} className="text-amber-400" />
                    {userProfile?.phone || "+91 9876543210"}
                  </p>
                </div>

                {/* College Year */}
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Academic Year</span>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <GraduationCap size={16} className="text-amber-400" />
                    {userProfile?.year || (isAdmin ? "Administrator" : "3rd Year")}
                  </p>
                </div>

                {/* Branch / Department */}
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Branch / Stream</span>
                  <p className="text-sm font-bold text-white flex items-center gap-2 truncate">
                    <Building2 size={16} className="text-amber-400 shrink-0" />
                    {userProfile?.branch || (isAdmin ? "System Admin" : "Computer Science & Eng (CSE)")}
                  </p>
                </div>

                {/* College Roll ID */}
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">College Roll ID</span>
                  <p className="text-sm font-bold text-amber-300 font-mono flex items-center gap-2">
                    <Award size={16} className="text-amber-400" />
                    {userProfile?.collegeId || (isAdmin ? "ADMIN-01" : "21BCSE104")}
                  </p>
                </div>
              </div>

              {/* Favorite IPL Franchise Card */}
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-black to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  {selectedTeamPreset ? (
                    <div className="w-14 h-14 p-2 bg-black/50 rounded-2xl border border-white/10 flex items-center justify-center">
                      <img
                        src={selectedTeamPreset.logoUrl}
                        alt={selectedTeamPreset.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-amber-500/15 rounded-2xl border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Shield size={28} />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">SUPPORTED FRANCHISE</span>
                    <h3 className="text-lg font-black text-white uppercase">
                      {userProfile?.favTeam || favTeam || "Royal Challengers Bengaluru"}
                    </h3>
                  </div>
                </div>

                <Link
                  href="/auction"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Flame size={15} /> Join Live Bidding
                </Link>
              </div>

              {/* Action Footer */}
              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/10 gap-3">
                <span className="text-xs text-slate-500 font-mono">
                  UID: <span className="text-slate-400">{user?.uid || "N/A"}</span>
                </span>

                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500 font-mono">
        COLLEGE PREMIER LEAGUE IPL AUCTION ENGINE &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
