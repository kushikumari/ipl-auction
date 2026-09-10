import { doc, getDocs, collection, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Team } from "@/types";

export const TEAM_LOCAL_LOGOS: Record<string, string> = {
  csk: "/Team photos/csk.svg",
  mi: "/Team photos/mi.svg",
  rcb: "/Team photos/https://i.pinimg.com/1200x/31/5c/6b/315c6b09718e946f649d46484472aa36.jpg",
  kkr: "/Team photos/kkr.svg",
  gt: "/Team photos/gt.svg",
  rr: "/Team photos/rr.png",
  srh: "/Team photos/srh.png",
  lsg: "/Team photos/lsg.avif",
  dc: "/Team photos/dc.jpg",
  pbks: "/Team photos/pbks.svg",
};

export const getTeamLogo = (teamId?: string | null, currentLogoUrl?: string | null): string => {
  if (!teamId) return currentLogoUrl || "/Team photos/csk.svg";
  const tid = teamId.toLowerCase().trim();

  // If already pointing to a valid local path in /Team photos/ or /teams/
  if (currentLogoUrl && (currentLogoUrl.startsWith("/Team photos/") || currentLogoUrl.startsWith("/teams/"))) {
    return currentLogoUrl;
  }

  // Look up known local logo
  if (TEAM_LOCAL_LOGOS[tid]) {
    return TEAM_LOCAL_LOGOS[tid];
  }

  // Check by team name/short code aliases
  if (tid.includes("chennai") || tid === "csk") return TEAM_LOCAL_LOGOS.csk;
  if (tid.includes("mumbai") || tid === "mi") return TEAM_LOCAL_LOGOS.mi;
  if (tid.includes("bengaluru") || tid.includes("bangalore") || tid === "rcb") return TEAM_LOCAL_LOGOS.rcb;
  if (tid.includes("kolkata") || tid === "kkr") return TEAM_LOCAL_LOGOS.kkr;
  if (tid.includes("gujarat") || tid === "gt") return TEAM_LOCAL_LOGOS.gt;
  if (tid.includes("rajasthan") || tid === "rr") return TEAM_LOCAL_LOGOS.rr;
  if (tid.includes("hyderabad") || tid === "srh") return TEAM_LOCAL_LOGOS.srh;
  if (tid.includes("lucknow") || tid === "lsg") return TEAM_LOCAL_LOGOS.lsg;
  if (tid.includes("delhi") || tid === "dc") return TEAM_LOCAL_LOGOS.dc;
  if (tid.includes("punjab") || tid === "pbks") return TEAM_LOCAL_LOGOS.pbks;

  return currentLogoUrl || "/Team photos/csk.svg";
};

/**
 * Updates all existing team documents in Firestore to use the local files in /Team photos/
 */
export const syncAllTeamLogosToLocal = async (): Promise<number> => {
  const teamsSnap = await getDocs(collection(db, "teams"));
  let updatedCount = 0;

  const updatePromises = teamsSnap.docs.map(async (docSnap) => {
    const tData = docSnap.data() as Team;
    const localLogo = getTeamLogo(docSnap.id, tData.logoUrl);
    if (tData.logoUrl !== localLogo) {
      await updateDoc(docSnap.ref, { logoUrl: localLogo });
      updatedCount++;
    }
  });

  await Promise.all(updatePromises);
  return updatedCount;
};
