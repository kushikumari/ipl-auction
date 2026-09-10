"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function TeamPage() {
  const { userProfile, team, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (team?.id) {
        router.push(`/team/${team.id}`);
      } else if (userProfile?.teamId) {
        router.push(`/team/${userProfile.teamId}`);
      } else {
        router.push("/");
      }
    }
  }, [team, userProfile, loading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );
}
