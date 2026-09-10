import { doc, getDoc, getDocs, setDoc, updateDoc, collection, onSnapshot, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Team } from "@/types";

export const getTeam = async (id: string) => {
  const docRef = doc(db, "teams", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Team) : null;
};

export const createTeam = async (team: Team) => {
  await setDoc(doc(db, "teams", team.id), team);
};

export const addTeam = async (team: Omit<Team, 'id'>) => {
  return await addDoc(collection(db, "teams"), team);
};

export const updateTeam = async (id: string, data: Partial<Team>) => {
  await updateDoc(doc(db, "teams", id), data);
};

export const deleteTeam = async (id: string) => {
  await deleteDoc(doc(db, "teams", id));
};

export const subscribeToTeam = (id: string, callback: (team: Team | null) => void) => {
  return onSnapshot(doc(db, "teams", id), (doc) => {
    callback(doc.exists() ? ({ id: doc.id, ...doc.data() } as Team) : null);
  });
};

export const subscribeToTeams = (callback: (teams: Team[]) => void) => {
  return onSnapshot(collection(db, "teams"), (snapshot) => {
    const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
    callback(teams);
  });
};

export const subscribeToTeamMembers = (teamId: string, callback: (members: any[]) => void) => {
  return onSnapshot(collection(db, "teams", teamId, "members"), (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(members);
  });
};

export const addTeamMember = async (teamId: string, member: { name: string; email: string }) => {
  const memberRef = await addDoc(collection(db, "teams", teamId, "members"), member);
  const teamDoc = await getDoc(doc(db, "teams", teamId));
  if (teamDoc.exists()) {
    const currentMembers = teamDoc.data().members || [];
    const newMemberObj = { id: memberRef.id, name: member.name, email: member.email.trim().toLowerCase() };
    await updateDoc(doc(db, "teams", teamId), {
      members: [...currentMembers, newMemberObj]
    });
  }
  return memberRef;
};

export const updateTeamMember = async (teamId: string, memberId: string, data: Partial<{ name: string; email: string }>) => {
  await updateDoc(doc(db, "teams", teamId, "members", memberId), data);
  const teamDoc = await getDoc(doc(db, "teams", teamId));
  if (teamDoc.exists()) {
    const currentMembers: any[] = teamDoc.data().members || [];
    const updatedMembers = currentMembers.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          name: data.name !== undefined ? data.name : m.name,
          email: data.email !== undefined ? data.email.trim().toLowerCase() : m.email
        };
      }
      return m;
    });
    await updateDoc(doc(db, "teams", teamId), { members: updatedMembers });
  }
};

export const removeTeamMember = async (teamId: string, memberId: string) => {
  await deleteDoc(doc(db, "teams", teamId, "members", memberId));
  const teamDoc = await getDoc(doc(db, "teams", teamId));
  if (teamDoc.exists()) {
    const currentMembers: any[] = teamDoc.data().members || [];
    const updatedMembers = currentMembers.filter(m => m.id !== memberId);
    await updateDoc(doc(db, "teams", teamId), { members: updatedMembers });
  }
};

export const addBiddedPlayerToTeam = async (
  teamId: string,
  playerData: {
    name: string;
    role: any;
    points: number;
    soldPrice: number;
  }
) => {
  const playerId = "custom-player-" + Date.now();
  const playerDocRef = doc(db, "players", playerId);
  const soldPriceNum = Number(playerData.soldPrice) || 0;
  const pointsNum = Number(playerData.points) || 0;

  const newPlayer = {
    id: playerId,
    name: playerData.name.trim(),
    role: playerData.role || "ALL_ROUNDER",
    basePrice: soldPriceNum,
    points: pointsNum,
    status: "SOLD",
    currentTeamId: teamId,
    soldPrice: soldPriceNum,
    photoUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80",
  };
  await setDoc(playerDocRef, newPlayer);

  const teamDocRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamDocRef);
  if (teamSnap.exists()) {
    const tData = teamSnap.data() as Team;
    const newSpent = (tData.totalSpent || 0) + soldPriceNum;
    const newPoints = (tData.totalPoints || 0) + pointsNum;
    const newCount = (tData.playerCount || 0) + 1;
    const newRemaining = Math.max(0, (tData.initialBudget || 100000000) - newSpent);
    await updateDoc(teamDocRef, {
      totalSpent: newSpent,
      totalPoints: newPoints,
      playerCount: newCount,
      remainingBudget: newRemaining,
    });
  }
  return playerId;
};

export const removeBiddedPlayerFromTeam = async (playerId: string, teamId: string) => {
  const pRef = doc(db, "players", playerId);
  const pSnap = await getDoc(pRef);
  if (pSnap.exists()) {
    const pData = pSnap.data() as any;
    const soldPriceNum = Number(pData.soldPrice) || 0;
    const pointsNum = Number(pData.points) || 0;

    await deleteDoc(pRef);

    const teamDocRef = doc(db, "teams", teamId);
    const teamSnap = await getDoc(teamDocRef);
    if (teamSnap.exists()) {
      const tData = teamSnap.data() as Team;
      const newSpent = Math.max(0, (tData.totalSpent || 0) - soldPriceNum);
      const newPoints = Math.max(0, (tData.totalPoints || 0) - pointsNum);
      const newCount = Math.max(0, (tData.playerCount || 0) - 1);
      const newRemaining = (tData.initialBudget || 100000000) - newSpent;
      await updateDoc(teamDocRef, {
        totalSpent: newSpent,
        totalPoints: newPoints,
        playerCount: newCount,
        remainingBudget: newRemaining,
      });
    }
  }
};

export const updateAllTeamsBudget = async (newInitialBudget: number) => {
  const querySnapshot = await getDocs(collection(db, "teams"));
  const updatePromises = querySnapshot.docs.map(async (d) => {
    const tData = d.data() as Team;
    const spent = tData.totalSpent || 0;
    const remaining = Math.max(0, newInitialBudget - spent);
    return updateDoc(d.ref, {
      initialBudget: newInitialBudget,
      remainingBudget: remaining,
    });
  });
  await Promise.all(updatePromises);
};

export const updateSingleTeamBudget = async (teamId: string, newInitialBudget: number) => {
  const teamDocRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamDocRef);
  if (teamSnap.exists()) {
    const tData = teamSnap.data() as Team;
    const spent = tData.totalSpent || 0;
    const remaining = Math.max(0, newInitialBudget - spent);
    await updateDoc(teamDocRef, {
      initialBudget: newInitialBudget,
      remainingBudget: remaining,
    });
  }
};
