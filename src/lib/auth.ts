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

export const ADMIN_EMAIL = "shiva.prasad7266@gmail.com";

export const registerUser = async (data: RegisterUserData) => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    // Set display name in Firebase Auth
    if (data.name) {
      await updateProfile(credential.user, { displayName: data.name });
    }

    const isAdmin = data.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
      role: isAdmin ? UserRole.ADMIN : UserRole.TEAM,
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
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // If admin account does not exist yet in Firebase Auth, automatically register it!
      if (
        (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") &&
        email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      ) {
        credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: "Shiva Prasad (Admin)" });
      } else {
        throw err;
      }
    }
    
    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // Resolve or automatically create role profile if missing
    let profile = await getUser(credential.user.uid);
    if (!profile) {
      profile = {
        uid: credential.user.uid,
        email: credential.user.email || email,
        name: credential.user.displayName || (isAdmin ? "Shiva Prasad" : email.split("@")[0]),
        phone: isAdmin ? "+91 9876543210" : "",
        year: isAdmin ? "Administrator" : "3rd Year",
        branch: isAdmin ? "System Admin" : "Computer Science & Eng (CSE)",
        collegeId: isAdmin ? "ADMIN-01" : "",
        favTeam: "Royal Challengers Bengaluru",
        role: isAdmin ? UserRole.ADMIN : UserRole.TEAM,
        teamId: null,
        createdAt: new Date().toISOString(),
      };
      await createUser(profile);
    } else if (isAdmin && profile.role !== UserRole.ADMIN) {
      profile.role = UserRole.ADMIN;
      await createUser(profile);
    }
    
    return { ...credential, role: profile.role, profile };
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  return await signOut(auth);
};

