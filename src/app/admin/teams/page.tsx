"use client";

import { useState, useEffect } from "react";
import { subscribeToTeams, addTeam, deleteTeam, updateTeam } from "@/lib/teams";
import { subscribeToPlayers } from "@/lib/players";
import { Team, Player, PlayerStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [budget, setBudget] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const { userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userProfile?.role !== "ADMIN") router.push("/login");
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubPlayers = subscribeToPlayers(setPlayers);
    setLoading(false);
    return () => { unsubTeams(); unsubPlayers(); };
  }, [userProfile, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialBudget = parseFloat(budget);
    if (initialBudget <= 0) return alert("Budget must be positive");
    
    await addTeam({
      name,
      ownerName,
      initialBudget,
      remainingBudget: initialBudget,
      totalSpent: 0,
      playerCount: 0,
      totalPoints: 0,
      setupCode,
      authConfigured: false
    });

    setName("");
    setOwnerName("");
    setBudget("");
    setSetupCode("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeam) return;
    await updateTeam(editTeam.id, {
        name: editTeam.name,
        ownerName: editTeam.ownerName,
        logoUrl: editTeam.logoUrl
    });
    setEditTeam(null);
  };

  const hasSoldPlayers = (teamId: string) => players.some(p => p.currentTeamId === teamId && p.status === PlayerStatus.SOLD);

  const handleDelete = async (team: Team) => {
    if (hasSoldPlayers(team.id)) return alert("Cannot delete a team that already owns SOLD players.");
    if (confirm(`Are you sure you want to delete ${team.name}?`)) {
      await deleteTeam(team.id);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6 text-amber-500">Team Management</h1>
      <form onSubmit={handleCreate} className="mb-8 p-4 bg-slate-900 border border-slate-800 rounded shadow-md grid grid-cols-5 gap-4">
        <input placeholder="Team Name" value={name} onChange={(e) => setName(e.target.value)} required className="p-2 bg-slate-800 border border-slate-700 rounded text-white" />
        <input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required className="p-2 bg-slate-800 border border-slate-700 rounded text-white" />
        <input type="number" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} required className="p-2 bg-slate-800 border border-slate-700 rounded text-white" />
        <input placeholder="Setup Code (Passkey)" value={setupCode} onChange={(e) => setSetupCode(e.target.value)} required className="p-2 bg-slate-800 border border-slate-700 rounded text-white" />
        <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-2 rounded">Create Team</button>
      </form>

      {teams.length === 0 ? <p className="text-slate-400">No teams configured yet.</p> : (
        <table className="w-full border-collapse border border-slate-800">
          <thead>
            <tr className="bg-slate-900 text-amber-500 border-b border-slate-800">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Owner</th>
              <th className="p-2 text-left">Budget</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Setup Code</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(t => (
              <tr key={t.id} className="border-b border-slate-800">
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.ownerName}</td>
                <td className="p-2">{t.initialBudget}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${t.authConfigured ? "bg-green-800 text-green-200" : "bg-amber-800 text-amber-200"}`}>
                    {t.authConfigured ? "Configured" : "Pending Setup"}
                  </span>
                </td>
                <td className="p-2 text-slate-400 font-mono">{t.setupCode || "N/A"}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => setEditTeam(t)} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">Edit</button>
                  <button onClick={() => handleDelete(t)} className="bg-red-600 text-white px-2 py-1 rounded text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Edit Modal */}
      {editTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <form onSubmit={handleUpdate} className="bg-slate-900 p-6 rounded-lg w-full max-w-md border border-slate-700 space-y-4">
                <h2 className="text-xl font-bold">Edit {editTeam.name}</h2>
                <input value={editTeam.name} onChange={e => setEditTeam({...editTeam, name: e.target.value})} className="w-full p-2 bg-slate-800 border rounded" placeholder="Team Name" />
                <input value={editTeam.ownerName} onChange={e => setEditTeam({...editTeam, ownerName: e.target.value})} className="w-full p-2 bg-slate-800 border rounded" placeholder="Owner Name" />
                <input value={editTeam.logoUrl || ""} onChange={e => setEditTeam({...editTeam, logoUrl: e.target.value})} className="w-full p-2 bg-slate-800 border rounded" placeholder="Logo URL" />
                {!hasSoldPlayers(editTeam.id) && (
                    <input type="number" value={editTeam.initialBudget} onChange={e => setEditTeam({...editTeam, initialBudget: parseFloat(e.target.value)})} className="w-full p-2 bg-slate-800 border rounded" placeholder="Initial Budget" />
                )}
                <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-amber-500 text-black font-bold p-2 rounded">Save</button>
                    <button type="button" onClick={() => setEditTeam(null)} className="flex-1 bg-slate-700 p-2 rounded">Cancel</button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
}

