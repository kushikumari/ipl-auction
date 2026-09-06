import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getUser } from "./users";
import { UserRole } from "@/types";

export const login = async (email: string, password: string) => {
  try {
    console.log("LOGIN_DIAGNOSTIC: Attempting signInWithEmailAndPassword");
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("LOGIN_DIAGNOSTIC: Firebase Auth Success, UID:", result.user.uid);
    
    // Resolve role before returning
    const profile = await getUser(result.user.uid);
    if (!profile) {
      throw new Error("Account authenticated, but no user profile is configured for this account.");
    }
    console.log("LOGIN_DIAGNOSTIC: Profile role resolved:", profile.role);
    
    return { ...result, role: profile.role };
  } catch (error) {
    console.error("LOGIN_DIAGNOSTIC: Login process failed", error);
    throw error;
  }
};

export const logout = async () => {
  return await signOut(auth);
};
