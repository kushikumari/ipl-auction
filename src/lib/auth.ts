import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getUser } from "./users";
import { UserRole } from "@/types";

export const login = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Resolve role before returning
    const profile = await getUser(result.user.uid);
    if (!profile) {
      throw new Error("Account authenticated, but no user profile is configured for this account.");
    }
    
    return { ...result, role: profile.role };
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  return await signOut(auth);
};
