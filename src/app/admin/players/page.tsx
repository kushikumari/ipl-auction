"use client";

import { useState, useEffect } from "react";
import { subscribeToPlayers, addPlayer, deletePlayer, updatePlayer } from "@/lib/players";
import { Player, PlayerRole, PlayerStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [points, setPoints] = useState("");
  const [role, setRole] = useState<PlayerRole>(PlayerRole.BATSMAN);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<PlayerRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | "ALL">("ALL");
  const { userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userProfile?.role !== "ADMIN") router.push("/login");
    const unsub = subscribeToPlayers((data) => {
      setPlayers(data);
      setLoading(false);
    });
    return unsub;
  }, [userProfile, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPlayer({
      name, photoUrl: photoUrl || null, role,
      basePrice: parseFloat(basePrice), points: parseInt(points), status: PlayerStatus.AVAILABLE,
    });
    setName(""); setPhotoUrl(""); setBasePrice(""); setPoints("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlayer) return;
    await updatePlayer(editPlayer.id, {
        name: editPlayer.name, photoUrl: editPlayer.photoUrl, role: editPlayer.role,
        basePrice: editPlayer.basePrice, points: editPlayer.points
    });
    setEditPlayer(null);
  };

  const handleDelete = async (p: Player) => {
    if (p.status === PlayerStatus.SOLD || p.status === PlayerStatus.LIVE) return alert(`Blocked: status is ${p.status}`);
    if (confirm(`Delete ${p.name}?`)) await deletePlayer(p.id);
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || p.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Player Management</h1>
      <form onSubmit={handleCreate} className="mb-8 p-4 bg-slate-900 border border-slate-800 rounded grid grid-cols-2 gap-4">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required className="p-2 bg-slate-800 border rounded" />
        <input placeholder="Photo URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="p-2 bg-slate-800 border rounded" />
        <select value={role} onChange={(e) => setRole(e.target.value as PlayerRole)} className="p-2 bg-slate-800 border rounded">
          {Object.values(PlayerRole).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex gap-2">
            <input type="number" placeholder="Base Price" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required className="flex-1 p-2 bg-slate-800 border rounded" />
            <input type="number" placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)} required className="flex-1 p-2 bg-slate-800 border rounded" />
        </div>
        <button type="submit" className="col-span-2 bg-amber-500 text-black font-bold p-2 rounded">Create Player</button>
      </form>

      <div className="mb-6 flex gap-4">
        <input placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)} className="p-2 bg-slate-800 border rounded flex-1" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="p-2 bg-slate-800 border rounded">
            <option value="ALL">All Roles</option>
            {Object.values(PlayerRole).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 bg-slate-800 border rounded">
            <option value="ALL">All Status</option>
            {Object.values(PlayerStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <table className="w-full border-collapse border border-slate-800">
        <thead className="bg-slate-900 text-amber-500"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Role</th><th className="p-2 text-left">Base Price</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Actions</th></tr></thead>
        <tbody>
          {filteredPlayers.map(p => (
            <tr key={p.id} className="border-b border-slate-800">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.role}</td>
              <td className="p-2">{p.basePrice}</td>
              <td className="p-2">{p.status}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => setEditPlayer(p)} className="bg-blue-600 px-2 py-1 rounded text-sm">Edit</button>
                <button onClick={() => handleDelete(p)} className="bg-red-600 px-2 py-1 rounded text-sm">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <form onSubmit={handleUpdate} className="bg-slate-900 p-6 rounded-lg w-full max-w-md border border-slate-700 space-y-4">
                <h2 className="text-xl font-bold">Edit {editPlayer.name}</h2>
                <input value={editPlayer.name} onChange={e => setEditPlayer({...editPlayer, name: e.target.value})} className="w-full p-2 bg-slate-800 border rounded" />
                <input value={editPlayer.photoUrl || ""} onChange={e => setEditPlayer({...editPlayer, photoUrl: e.target.value})} className="w-full p-2 bg-slate-800 border rounded" placeholder="Photo URL" />
                <select value={editPlayer.role} onChange={e => setEditPlayer({...editPlayer, role: e.target.value as PlayerRole})} className="w-full p-2 bg-slate-800 border rounded">
                    {Object.values(PlayerRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex gap-2">
                    <input type="number" value={editPlayer.basePrice} onChange={e => setEditPlayer({...editPlayer, basePrice: parseFloat(e.target.value)})} className="w-full p-2 bg-slate-800 border rounded" />
                    <input type="number" value={editPlayer.points} onChange={e => setEditPlayer({...editPlayer, points: parseInt(e.target.value)})} className="w-full p-2 bg-slate-800 border rounded" />
                </div>
                <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-amber-500 text-black font-bold p-2 rounded">Save</button>
                    <button type="button" onClick={() => setEditPlayer(null)} className="flex-1 bg-slate-700 p-2 rounded">Cancel</button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
}
