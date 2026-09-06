"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  subscribeToAuctionState, 
  placeBid, 
  sellCurrentPlayer, 
  markUnsold,
  AuctionError 
} from "@/lib/auction";
import { subscribeToTeams } from "@/lib/teams";
import { subscribeToPlayer, subscribeToPlayers } from "@/lib/players";
import { AuctionState, Team, Player, AuctionStatus, UserRole, PlayerStatus } from "@/types";
import { Loader2, Gavel, Users, Trophy, Clock, ArrowLeft, Shield, AlertCircle, History } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AuctionRoom() {
  const { userProfile, team, loading: authLoading } = useAuth();
  const router = useRouter();
  const [auction, setAuction] = useState<AuctionState | null | undefined>(undefined);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);


  useEffect(() => {
    if (!authLoading && !userProfile) router.push("/login");
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    const unsubAuction = subscribeToAuctionState(
      (data) => setAuction(data),
      (err) => setError("Failed to load auction data: " + err.message)
    );
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubPlayers = subscribeToPlayers(setAllPlayers);
    return () => {
      unsubAuction();
      unsubTeams();
      unsubPlayers();
    };
  }, []);

  useEffect(() => {
    if (auction?.currentPlayerId) {
      return subscribeToPlayer(auction.currentPlayerId, setCurrentPlayer);
    } else {
      setCurrentPlayer(null);
    }
  }, [auction?.currentPlayerId]);

  useEffect(() => {
    if (auction) {
      const minNext = auction.currentBid > 0 ? auction.currentBid + 10 : (currentPlayer?.basePrice || 100);
      setBidAmount(minNext);
    }
  }, [auction?.currentBid, currentPlayer?.basePrice]);

  const handleBid = async (amountToBid?: number) => {
    if (!team) return;
    const targetAmount = amountToBid ?? bidAmount;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await placeBid(team.id, targetAmount);
      setSuccessMsg("Successfully placed bid of ₹" + targetAmount + "!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      if (err instanceof AuctionError) {
        switch (err.code) {
          case "AUCTION_NOT_LIVE": setError("Auction is not currently live."); break;
          case "AUCTION_EXPIRED": setError("Bidding time has expired for this player."); break;
          case "BID_TOO_LOW": setError("Bid must be higher than current bid + increment."); break;
          case "TEAM_FULL": setError("Your team squad is full (max 8 players)."); break;
          case "BID_EXCEEDS_BUDGET": setError("Bid exceeds your team's remaining budget."); break;
          default: setError(err.code);
        }
      } else {
        setError(err.message || "Failed to place bid");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    setLoading(true);
    setError(null);
    try {
      await sellCurrentPlayer();
    } catch (err: any) {
      setError(err.message || "Failed to mark sold");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsold = async () => {
    setLoading(true);
    setError(null);
    try {
      await markUnsold();
    } catch (err: any) {
      setError(err.message || "Failed to mark unsold");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || auction === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  if (auction === null) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Gavel size={64} className="text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Auction Not Initialized</h2>
        <p className="text-slate-400 mb-6">The auction document has not been created by an administrator yet.</p>
        <Link href={userProfile?.role === UserRole.ADMIN ? "/admin" : "/team"} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition">
          Return to Dashboard
        </Link>
      </main>
    );
  }

  const teamPurchasedPlayers = allPlayers.filter(p => team && p.status === PlayerStatus.SOLD && p.currentTeamId === team.id);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <Link href={userProfile?.role === UserRole.ADMIN ? "/admin" : "/team"} className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Gavel className="text-amber-500" /> Live Auction Arena
              </h1>
              <p className="text-slate-400 text-sm">Status: <span className="text-amber-500 font-bold uppercase">{auction.status}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {team && (
              <div className="bg-slate-900 px-5 py-3 rounded-2xl border border-slate-800 text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider">{team.name}</p>
                <p className="text-xl font-extrabold text-amber-500">₹{team.remainingBudget.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Squad: {team.playerCount}/8 Players</p>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-950/50 border border-green-800 text-green-300 rounded-2xl flex items-center gap-3">
            <Trophy size={20} className="text-green-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {currentPlayer ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-600/10 text-amber-500 px-6 py-2 rounded-bl-2xl font-bold text-sm tracking-wider uppercase border-l border-b border-amber-600/20">
                  {currentPlayer.role}
                </div>

                <div className="flex items-start gap-6 mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl font-bold text-amber-500 overflow-hidden shadow-inner">
                    {currentPlayer.photoUrl ? (
                      <img src={currentPlayer.photoUrl} alt={currentPlayer.name} className="w-full h-full object-cover" />
                    ) : (
                      currentPlayer.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-4xl font-extrabold text-white mb-2">{currentPlayer.name}</h2>
                    <div className="flex flex-wrap gap-4 text-slate-400 text-sm">
                      <p>Base Price: <span className="text-white font-semibold">₹{currentPlayer.basePrice.toLocaleString()}</span></p>
                      <p>Tournament Points: <span className="text-amber-400 font-semibold">{currentPlayer.points} pts</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Current Highest Bid</p>
                    <p className="text-5xl font-extrabold text-amber-500">₹{auction.currentBid.toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-300 font-medium">Highest Bidder: <span className="text-amber-400 font-bold">{auction.highestBidderTeamName || "No Bids Yet"}</span></p>
                  </div>

                  {/* Timer removed */}
                </div>

                {userProfile?.role === UserRole.TEAM && auction.status === AuctionStatus.LIVE && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Place Your Bid</h3>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 50, 100, 500].map(inc => {
                        const nextVal = auction.currentBid + inc;
                        return (
                          <button
                            key={inc}
                            onClick={() => { setBidAmount(nextVal); handleBid(nextVal); }}
                            disabled={loading || (team ? nextVal > team.remainingBudget : false)}
                            className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold rounded-xl border border-slate-700 transition"
                          >
                            +₹{inc}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        value={bidAmount} 
                        onChange={e => setBidAmount(parseInt(e.target.value) || 0)} 
                        className="bg-slate-900 px-4 py-3 rounded-xl flex-1 border border-slate-800 text-white font-bold focus:outline-none focus:border-amber-500"
                        placeholder="Enter bid amount"
                      />
                      <button 
                        onClick={() => handleBid()} 
                        disabled={loading}
                        className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {loading && <Loader2 size={16} className="animate-spin" />} Place Bid
                      </button>
                    </div>
                  </div>
                )}

                {userProfile?.role === UserRole.ADMIN && auction.status === AuctionStatus.LIVE && (
                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={() => {
                        console.log("DIAGNOSTIC: SOLD button clicked");
                        handleSell();
                      }} 
                      disabled={loading || !auction.highestBidderTeamId}
                      className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-40"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />} Mark Player SOLD
                    </button>
                    <button 
                      onClick={() => {
                        console.log("DIAGNOSTIC: UNSOLD button clicked");
                        handleUnsold();
                      }} 
                      disabled={loading}
                      className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-40"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />} Mark Player UNSOLD
                    </button>

                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-slate-900 p-16 rounded-3xl border border-slate-800 text-center space-y-4">
                <Gavel size={48} className="mx-auto text-slate-600" />
                <h3 className="text-xl font-bold text-slate-300">No Player Currently on Auction</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  {userProfile?.role === UserRole.ADMIN 
                    ? "Go to the Admin Dashboard to select an available player and start a new auction round."
                    : "Please wait while the administrator selects the next player for bidding."}
                </p>
                {userProfile?.role === UserRole.ADMIN && (
                  <Link href="/admin" className="inline-block mt-4 px-6 py-3 bg-amber-600 text-slate-950 font-bold rounded-xl">
                    Open Admin Controls
                  </Link>
                )}
              </div>
            )}

            {auction.bidHistory && auction.bidHistory.length > 0 && (
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-200">
                  <History size={18} className="text-amber-500" /> Live Bid History Ticker
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {auction.bidHistory.slice().reverse().map((bid, idx) => (
                    <div key={bid.id || idx} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800/60 text-sm">
                      <span className="font-semibold text-slate-300">{bid.teamName}</span>
                      <span className="font-extrabold text-amber-500">₹{bid.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-200">
                <Users size={18} className="text-amber-500" /> Participating Teams
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {teams.map(t => (
                  <div key={t.id} className={`p-4 rounded-2xl border transition ${auction.highestBidderTeamId === t.id ? 'bg-amber-950/30 border-amber-600' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">{t.name}</span>
                      <span className="text-amber-400 font-extrabold text-sm">₹{t.remainingBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Owner: {t.ownerName}</span>
                      <span>Squad: {t.playerCount}/8</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {team && (
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-slate-200">
                  <Shield size={18} className="text-amber-500" /> Your Squad Roster
                </h3>
                {teamPurchasedPlayers.length === 0 ? (
                  <p className="text-slate-500 text-sm">No players purchased yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {teamPurchasedPlayers.map(p => (
                      <div key={p.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-bold text-slate-200">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.role}</p>
                        </div>
                        <span className="font-extrabold text-green-400">₹{p.soldPrice?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
