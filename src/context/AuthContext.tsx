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
      console.log("AUTH_CONTEXT: onAuthStateChanged FIRED", { 
        firebaseUser: firebaseUser ? firebaseUser.uid : null 
      });
      setUser(firebaseUser);
      if (firebaseUser) {
        console.log("AUTH_CONTEXT: Attempting to fetch user profile for", firebaseUser.uid);
        const profile = await getUser(firebaseUser.uid);
        console.log("AUTH_CONTEXT: User profile result:", profile);
        setUserProfile(profile);

        if (profile?.teamId) {
          console.log("AUTH_CONTEXT: Subscribing to team", profile.teamId);
          subscribeToTeam(profile.teamId, (teamData) => {
            setTeam(teamData);
            setLoading(false); // Set loading to false once team is loaded
          });
        } else {
          setTeam(null);
          setLoading(false); // Set loading to false immediately
        }
      } else {
        console.log("AUTH_CONTEXT: User logged out");
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
