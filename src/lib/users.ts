import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "@/types";

export const getUser = async (uid: string) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data() as UserProfile;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (user: UserProfile) => {
  await setDoc(doc(db, "users", user.uid), user);
};

export const updateUser = async (uid: string, data: Partial<UserProfile>) => {
  await updateDoc(doc(db, "users", uid), data);
};
