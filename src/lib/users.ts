import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "@/types";

export const getUser = async (uid: string) => {
  try {
    console.log("LOGIN_DIAGNOSTIC: Reading Firestore doc for UID:", uid);
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.warn("LOGIN_DIAGNOSTIC: User profile NOT FOUND for UID:", uid);
      return null;
    }
    console.log("LOGIN_DIAGNOSTIC: Firestore Read Success");
    return docSnap.data() as UserProfile;
  } catch (error) {
    console.error("LOGIN_DIAGNOSTIC: Firestore Read Failed", error);
    throw error;
  }
};

export const createUser = async (user: UserProfile) => {
  await setDoc(doc(db, "users", user.uid), user);
};

export const updateUser = async (uid: string, data: Partial<UserProfile>) => {
  await updateDoc(doc(db, "users", uid), data);
};
