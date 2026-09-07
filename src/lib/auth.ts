import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut 
} from "firebase/auth";
import { auth } from "./firebase";
import { getUser, createUser } from "./users";
import { UserProfile, UserRole } from "@/types";

export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  phone: string;
  year: string;
  branch: string;
  collegeId?: string;
  favTeam?: string;
}

export const registerUser = async (data: RegisterUserData) => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    // Set display name in Firebase Auth
    if (data.name) {
      await updateProfile(credential.user, { displayName: data.name });
    }

    // Create user profile in Firestore
    const newProfile: UserProfile = {
      uid: credential.user.uid,
      email: data.email,
      name: data.name,
      phone: data.phone,
      year: data.year,
      branch: data.branch,
      collegeId: data.collegeId || "",
      favTeam: data.favTeam || "",
      role: UserRole.TEAM,
      teamId: null,
      createdAt: new Date().toISOString(),
    };

    await createUser(newProfile);
    return { credential, profile: newProfile };
  } catch (error) {
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Resolve or automatically create role profile if missing
    let profile = await getUser(result.user.uid);
    if (!profile) {
      // Auto-initialize profile for existing auth user
      profile = {
        uid: result.user.uid,
        email: result.user.email || email,
        name: result.user.displayName || email.split("@")[0],
        role: UserRole.TEAM,
        teamId: null,
        createdAt: new Date().toISOString(),
      };
      await createUser(profile);
    }
    
    return { ...result, role: profile.role, profile };
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  return await signOut(auth);
};

