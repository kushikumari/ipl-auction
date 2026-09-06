"use client";
import { useState, useEffect } from "react";
import { subscribeToTeams } from "@/lib/teams";
import { Team } from "@/types";

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    return subscribeToTeams(setTeams);
  }, []);

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.playerCount !== a.playerCount) return b.playerCount - a.playerCount;
    return b.remainingBudget - a.remainingBudget;
  });

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>
      <table className="w-full text-left border-collapse border border-slate-800">
        <thead><tr className="bg-slate-900 text-amber-500">
          <th className="p-4">Rank</th><th className="p-4">Team</th>
          <th className="p-4">Points</th><th className="p-4">Players</th>
          <th className="p-4">Spent</th><th className="p-4">Remaining Budget</th>
        </tr></thead>
        <tbody>
          {sortedTeams.map((t, i) => (
            <tr key={t.id} className="border-b border-slate-800">
              <td className="p-4">{i + 1}</td>
              <td className="p-4 font-bold">{t.name}</td>
              <td className="p-4">{t.totalPoints}</td>
              <td className="p-4">{t.playerCount}</td>
              <td className="p-4">₹{t.totalSpent}</td>
              <td className="p-4">₹{t.remainingBudget}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}