import { PlayerRole, PlayerStatus } from "@/types";

export interface IPLTeamPreset {
  id: string;
  name: string;
  shortCode: string;
  ownerName: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  logoUrl: string;
  initialBudget: number;
}

export interface IPLPlayerPreset {
  id: string;
  name: string;
  teamName: string;
  role: PlayerRole;
  basePrice: number;
  points: number;
  photoUrl: string;
}

export const IPL_TEAMS_PRESETS: IPLTeamPreset[] = [
  {
    id: "csk",
    name: "Chennai Super Kings",
    shortCode: "CSK",
    ownerName: "N. Srinivasan",
    color: "from-yellow-400 to-amber-600",
    bgGradient: "rgba(234, 179, 8, 0.15)",
    borderColor: "rgba(234, 179, 8, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "mi",
    name: "Mumbai Indians",
    shortCode: "MI",
    ownerName: "Nita Ambani",
    color: "from-blue-500 to-indigo-700",
    bgGradient: "rgba(59, 130, 246, 0.15)",
    borderColor: "rgba(59, 130, 246, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "rcb",
    name: "Royal Challengers Bengaluru",
    shortCode: "RCB",
    ownerName: "Prathamesh",
    color: "from-red-600 to-slate-900",
    bgGradient: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/2/2a/Royal_Challengers_Bengaluru_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "kkr",
    name: "Kolkata Knight Riders",
    shortCode: "KKR",
    ownerName: "Shah Rukh Khan",
    color: "from-purple-600 to-amber-500",
    bgGradient: "rgba(168, 85, 247, 0.15)",
    borderColor: "rgba(168, 85, 247, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "gt",
    name: "Gujarat Titans",
    shortCode: "GT",
    ownerName: "CVC Capital",
    color: "from-cyan-600 to-slate-900",
    bgGradient: "rgba(8, 145, 178, 0.15)",
    borderColor: "rgba(8, 145, 178, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "rr",
    name: "Rajasthan Royals",
    shortCode: "RR",
    ownerName: "Manoj Badale",
    color: "from-pink-500 to-blue-700",
    bgGradient: "rgba(236, 72, 153, 0.15)",
    borderColor: "rgba(236, 72, 153, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/6/60/Rajasthan_Royals_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "srh",
    name: "Sunrisers Hyderabad",
    shortCode: "SRH",
    ownerName: "Kalanithi Maran",
    color: "from-orange-500 to-black",
    bgGradient: "rgba(249, 115, 22, 0.15)",
    borderColor: "rgba(249, 115, 22, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/8/81/Sunrisers_Hyderabad_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "lsg",
    name: "Lucknow Super Giants",
    shortCode: "LSG",
    ownerName: "Sanjiv Goenka",
    color: "from-sky-400 to-blue-900",
    bgGradient: "rgba(56, 189, 248, 0.15)",
    borderColor: "rgba(56, 189, 248, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/a9/Lucknow_Super_Giants_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "dc",
    name: "Delhi Capitals",
    shortCode: "DC",
    ownerName: "Parth Jindal",
    color: "from-blue-600 to-red-600",
    bgGradient: "rgba(37, 99, 235, 0.15)",
    borderColor: "rgba(37, 99, 235, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/2/2f/Delhi_Capitals_Logo.svg",
    initialBudget: 100000000,
  },
  {
    id: "pbks",
    name: "Punjab Kings",
    shortCode: "PBKS",
    ownerName: "Preity Zinta",
    color: "from-red-600 to-yellow-500",
    bgGradient: "rgba(220, 38, 38, 0.15)",
    borderColor: "rgba(220, 38, 38, 0.4)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo.svg",
    initialBudget: 100000000,
  },
];

export const MARQUEE_INDIAN_PLAYERS: IPLPlayerPreset[] = [
  {
    id: "virat-kohli",
    name: "Virat Kohli",
    teamName: "Royal Challengers Bengaluru",
    role: PlayerRole.BATSMAN,
    basePrice: 20000000,
    points: 99,
    photoUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "rohit-sharma",
    name: "Rohit Sharma",
    teamName: "Mumbai Indians",
    role: PlayerRole.BATSMAN,
    basePrice: 20000000,
    points: 98,
    photoUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "ms-dhoni",
    name: "MS Dhoni",
    teamName: "Chennai Super Kings",
    role: PlayerRole.WICKET_KEEPER,
    basePrice: 20000000,
    points: 99,
    photoUrl: "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "jasprit-bumrah",
    name: "Jasprit Bumrah",
    teamName: "Mumbai Indians",
    role: PlayerRole.BOWLER,
    basePrice: 20000000,
    points: 99,
    photoUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "hardik-pandya",
    name: "Hardik Pandya",
    teamName: "Mumbai Indians",
    role: PlayerRole.ALL_ROUNDER,
    basePrice: 20000000,
    points: 96,
    photoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "suryakumar-yadav",
    name: "Suryakumar Yadav",
    teamName: "Mumbai Indians",
    role: PlayerRole.BATSMAN,
    basePrice: 20000000,
    points: 97,
    photoUrl: "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "ravindra-jadeja",
    name: "Ravindra Jadeja",
    teamName: "Chennai Super Kings",
    role: PlayerRole.ALL_ROUNDER,
    basePrice: 20000000,
    points: 96,
    photoUrl: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "rishabh-pant",
    name: "Rishabh Pant",
    teamName: "Delhi Capitals",
    role: PlayerRole.WICKET_KEEPER,
    basePrice: 20000000,
    points: 95,
    photoUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "shubman-gill",
    name: "Shubman Gill",
    teamName: "Gujarat Titans",
    role: PlayerRole.BATSMAN,
    basePrice: 20000000,
    points: 96,
    photoUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kl-rahul",
    name: "KL Rahul",
    teamName: "Lucknow Super Giants",
    role: PlayerRole.WICKET_KEEPER,
    basePrice: 20000000,
    points: 95,
    photoUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "shreyas-iyer",
    name: "Shreyas Iyer",
    teamName: "Kolkata Knight Riders",
    role: PlayerRole.BATSMAN,
    basePrice: 20000000,
    points: 94,
    photoUrl: "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "sanju-samson",
    name: "Sanju Samson",
    teamName: "Rajasthan Royals",
    role: PlayerRole.WICKET_KEEPER,
    basePrice: 20000000,
    points: 94,
    photoUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=400&q=80",
  },
];
