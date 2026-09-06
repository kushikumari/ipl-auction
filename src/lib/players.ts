import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, addDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { Player } from "@/types";

export const getPlayer = async (id: string) => {
  const docRef = doc(db, "players", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Player) : null;
};

export const createPlayer = async (player: Player) => {
  await setDoc(doc(db, "players", player.id), player);
};

export const addPlayer = async (player: Omit<Player, 'id'>) => {
  return await addDoc(collection(db, "players"), player);
};

export const updatePlayer = async (id: string, data: Partial<Player>) => {
  await updateDoc(doc(db, "players", id), data);
};

export const deletePlayer = async (id: string) => {
  return await runTransaction(db, async (transaction) => {
    const pRef = doc(db, "players", id);
    const pSnap = await transaction.get(pRef);
    if (!pSnap.exists()) throw new Error("PLAYER_NOT_FOUND");
    const p = pSnap.data() as Player;
    if (p.status === 'SOLD' || p.status === 'LIVE') throw new Error(`PROTECTED_PLAYER_${p.status}`);
    transaction.delete(pRef);
  });
};

export const subscribeToPlayer = (id: string, callback: (player: Player | null) => void) => {
  return onSnapshot(doc(db, "players", id), (doc) => {
    callback(doc.exists() ? ({ id: doc.id, ...doc.data() } as Player) : null);
  });
};

export const subscribeToPlayers = (callback: (players: Player[]) => void) => {
  return onSnapshot(collection(db, "players"), (snapshot) => {
    const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
    callback(players);
  });
};

