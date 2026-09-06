"use client";
import { useState, useEffect } from "react";
import { subscribeToTeams } from "@/lib/teams";
import { subscribeToPlayers } from "@/lib/players";
import { Team, Player, PlayerStatus } from "@/types";

export default function ResultsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubPlayers = subscribeToPlayers((data) => {
      setPlayers(data);
      setLoading(false);
    });
    return () => { unsubTeams(); unsubPlayers(); };
  }, []);

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.playerCount !== a.playerCount) return b.playerCount - a.playerCount;
    return b.remainingBudget - a.remainingBudget;
  });

  const winner = sortedTeams[0];

  // Calculations
  const soldPlayers = players.filter(p => p.status === PlayerStatus.SOLD);
  const unsoldPlayers = players.filter(p => p.status === PlayerStatus.UNSOLD);
  
  const highestBidPlayer = soldPlayers.reduce((max, p) => (p.soldPrice || 0) > (max.soldPrice || 0) ? p : max, soldPlayers[0] || null);
  const highestSpendingTeam = teams.reduce((max, t) => t.totalSpent > max.totalSpent ? t : max, teams[0] || null);
  const highestPointsTeam = teams.reduce((max, t) => t.totalPoints > max.totalPoints ? t : max, teams[0] || null);
  
  const totalMoneySpent = teams.reduce((sum, t) => sum + t.totalSpent, 0);
  const averageSalePrice = soldPlayers.length > 0 ? (totalMoneySpent / soldPlayers.length).toFixed(2) : 0;

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-8">
      <h1 className="text-3xl font-bold text-amber-500">Tournament Final Results</h1>

      {winner && (
        <div className="p-6 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-2xl text-slate-950 font-bold text-center space-y-2">
          <h2 className="text-2xl">🏆 CHAMPION: {winner.name} 🏆</h2>
          <p className="text-lg">Owner: {winner.ownerName} | Points: {winner.totalPoints} | Remaining Budget: ₹{winner.remainingBudget}</p>
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-slate-400 text-sm">Highest Bid Player</h3>
          <p className="text-xl font-bold">{highestBidPlayer ? `${highestBidPlayer.name} (₹${highestBidPlayer.soldPrice})` : "N/A"}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-slate-400 text-sm">Highest Spending Team</h3>
          <p className="text-xl font-bold">{highestSpendingTeam ? `${highestSpendingTeam.name} (₹${highestSpendingTeam.totalSpent})` : "N/A"}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-slate-400 text-sm">Total Money Spent</h3>
          <p className="text-xl font-bold">₹{totalMoneySpent}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-slate-400 text-sm">Average Player Price</h3>
          <p className="text-xl font-bold">₹{averageSalePrice}</p>
        </div>
      </div>

      {/* Full Squad Listings */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Team Squads</h2>
        {sortedTeams.map((team, idx) => {
          const teamSquad = players.filter(p => p.currentTeamId === team.id && p.status === PlayerStatus.SOLD);
          return (
            <div key={team.id} className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xl font-bold text-amber-500">#{idx + 1} {team.name} <span className="text-slate-400 text-sm font-normal">({team.totalPoints} points, spent ₹{team.totalSpent})</span></h3>
              {teamSquad.length === 0 ? <p className="text-slate-500">No players purchased.</p> : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {teamSquad.map(p => (
                    <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.role}</p>
                      <p className="text-sm font-semibold text-amber-400">₹{p.soldPrice} | {p.points} Pts</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}