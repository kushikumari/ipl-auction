import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

const SETTINGS_REF = doc(db, "settings", "global");

export interface GlobalSettings {
  leaderboardVisible: boolean;
  defaultPurseBudget?: number;
}

export const getGlobalSettings = async (): Promise<GlobalSettings> => {
  const snap = await getDoc(SETTINGS_REF);
  if (snap.exists()) return snap.data() as GlobalSettings;
  return { leaderboardVisible: false, defaultPurseBudget: 1000000000 };
};

export const setLeaderboardVisible = async (visible: boolean) => {
  await setDoc(SETTINGS_REF, { leaderboardVisible: visible }, { merge: true });
};

export const setDefaultPurseBudget = async (budget: number) => {
  await setDoc(SETTINGS_REF, { defaultPurseBudget: budget }, { merge: true });
};

export const subscribeToGlobalSettings = (
  callback: (settings: GlobalSettings) => void
) => {
  return onSnapshot(SETTINGS_REF, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as GlobalSettings);
    } else {
      callback({ leaderboardVisible: false, defaultPurseBudget: 1000000000 });
    }
  });
};
