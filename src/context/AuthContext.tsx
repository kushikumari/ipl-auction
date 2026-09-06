"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser } from "@/lib/users";
import { subscribeToTeam } from "@/lib/teams";
import { UserProfile, Team } from "@/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  team: Team | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  team: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await getUser(firebaseUser.uid);
        setUserProfile(profile);

        if (profile?.teamId) {
          subscribeToTeam(profile.teamId, (teamData) => {
            setTeam(teamData);
            setLoading(false); // Set loading to false once team is loaded
          });
        } else {
          setTeam(null);
          setLoading(false); // Set loading to false immediately
        }
      } else {
        setUserProfile(null);
        setTeam(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, team, loading, logout: () => auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
