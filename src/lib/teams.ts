import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, addDoc } from "firebase/firestore";
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

