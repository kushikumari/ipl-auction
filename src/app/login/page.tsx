"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { login, registerUser, ADMIN_EMAIL } from "@/lib/auth";
import { Trophy, ArrowLeft, Mail, Lock, User, Phone, GraduationCap, Building2, Shield, Eye, EyeOff, Sparkles, CheckCircle, Flame } from "lucide-react";
import { IPL_TEAMS_PRESETS } from "@/lib/seedIPL";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("3rd Year");
  const [branch, setBranch] = useState("Computer Science & Eng (CSE)");
  const [collegeId, setCollegeId] = useState("");
  const [favTeam, setFavTeam] = useState("Royal Challengers Bengaluru");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (authMode === "SIGNUP") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match!");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        if (!phone || phone.length < 10) {
          throw new Error("Please enter a valid 10-digit phone number.");
        }

        await registerUser({
          email,
          password,
          name,
          phone,
          year,
          branch,
          collegeId,
          favTeam,
        });

        const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

        setSuccessMsg("Account registered successfully! Redirecting...");
        setTimeout(() => {
          router.push(isAdmin ? "/admin" : "/");
        }, 1200);
      } else {
        // Direct Unified Login (Works for everyone; automatically detects admin)
        const result = await login(email.trim(), password);
        const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() || result.role === "ADMIN";

        setSuccessMsg(isAdmin ? "Welcome Administrator! Accessing Gavel Room..." : "Logged in successfully!");
        setTimeout(() => {
          router.push(isAdmin ? "/admin" : "/");
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Authentication failed. Please check your credentials.";
      if (msg.includes("auth/configuration-not-found") || msg.includes("configuration-not-found")) {
        msg = "Firebase Email/Password Authentication is not yet enabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method > Enable 'Email/Password'.";
      } else if (msg.includes("auth/user-not-found") || msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
        msg = "Invalid email or password. If you are a new user, please switch to 'Create Account (Sign Up)' below.";
      } else if (msg.includes("auth/email-already-in-use")) {
        msg = "An account with this email already exists. Please switch to 'Sign In' above.";
      } else if (msg.includes("Missing or insufficient permissions") || msg.includes("permission-denied")) {
        msg = "Firestore permission error. Please enable Test Mode rules in Firebase Console: Cloud Firestore > Rules > allow read, write: if true;";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-amber-500/20 via-indigo-600/15 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-purple-600/15 blur-[120px] pointer-events-none" />

      {/* Top Header Bar with reliable Back Button */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-6 md:px-12 py-4 flex justify-between items-center">
        <button
          onClick={handleBack}
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

      {/* Main All-In-One Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 z-10 my-4">
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-card glass-card-gold rounded-3xl p-6 sm:p-8 md:p-10 border border-amber-500/30 shadow-2xl w-full max-w-xl relative overflow-hidden bg-slate-900/90 backdrop-blur-2xl"
        >
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-widest mb-3">
              <Sparkles size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
              AUTHENTICATION PORTAL
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {authMode === "LOGIN" ? "Sign In to Your Account" : "Create New Account"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {authMode === "LOGIN" 
                ? "Sign in with your email & password to access bidding, purse status, and live features."
                : "Fill in your college details once to participate in the live IPL auction."}
            </p>
          </div>

          {/* Simple Mode Switcher (Sign In vs Create Account) */}
          <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => { setAuthMode("LOGIN"); setError(null); setSuccessMsg(null); }}
              className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                authMode === "LOGIN"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("SIGNUP"); setError(null); setSuccessMsg(null); }}
              className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                authMode === "SIGNUP"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account (Sign Up)
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* SIGN UP EXTRA DETAILS FIELDS */}
            {authMode === "SIGNUP" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Mobile / WhatsApp No *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* College Year */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">College Year *</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <select
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
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
                </div>

                {/* Branch / Stream */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Department / Branch *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <select
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
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
                </div>

                {/* College ID / Roll No */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">College Roll ID</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="e.g. 21BCSE104"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                  />
                </div>

                {/* Favorite IPL Team */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Favorite IPL Team</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <select
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
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
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  placeholder="name@gmail.com or student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {authMode === "SIGNUP" && (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Error and Success Alerts */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                {successMsg}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-xl shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 hover:scale-[1.02]"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Flame size={16} />
                  {authMode === "SIGNUP" ? "Complete Registration" : "Sign In & Enter"}
                </>
              )}
            </button>
          </form>

          {/* Bottom Switcher */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            {authMode === "LOGIN" ? (
              <p>
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => { setAuthMode("SIGNUP"); setError(null); }}
                  className="text-amber-400 font-bold hover:underline ml-1"
                >
                  Create Account here
                </button>
              </p>
            ) : (
              <p>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => { setAuthMode("LOGIN"); setError(null); }}
                  className="text-amber-400 font-bold hover:underline ml-1"
                >
                  Sign In with Email &amp; Password
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500 font-mono">
        COLLEGE PREMIER LEAGUE IPL AUCTION &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

