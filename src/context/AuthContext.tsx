"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser } from "@/lib/users";
import { subscribeToTeam } from "@/lib/teams";
import { UserProfile, Team, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  team: Team | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  team: null,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser: User) => {
    try {
      let profile = await getUser(firebaseUser.uid);
      const isSuperAdmin = firebaseUser.email?.toLowerCase() === "shiva.prasad7266@gmail.com";
      
      if (!profile) {
        profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || (isSuperAdmin ? "Shiva Prasad" : "Participant"),
          role: isSuperAdmin ? UserRole.ADMIN : UserRole.TEAM,
          teamId: null,
          createdAt: new Date().toISOString(),
        };
      } else if (isSuperAdmin && profile.role !== UserRole.ADMIN) {
        profile.role = UserRole.ADMIN;
      }

      setUserProfile(profile);

      if (profile?.teamId) {
        subscribeToTeam(profile.teamId, (teamData) => {
          setTeam(teamData);
          setLoading(false);
        });
      } else {
        setTeam(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.warn("[AuthContext]: Profile fetch error:", err.message);
      const isSuperAdmin = firebaseUser.email?.toLowerCase() === "shiva.prasad7266@gmail.com";
      setUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || (isSuperAdmin ? "Shiva Prasad" : "Participant"),
        role: isSuperAdmin ? UserRole.ADMIN : UserRole.TEAM,
        teamId: null,
        createdAt: new Date().toISOString(),
      });
      setTeam(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setUserProfile(null);
        setTeam(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const isAdmin = user?.email?.toLowerCase() === "shiva.prasad7266@gmail.com" || userProfile?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider value={{ user, userProfile, team, isAdmin, loading, refreshProfile, logout: () => auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
