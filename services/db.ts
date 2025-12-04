import { UserProfile } from "../types";

// Simulating a database with LocalStorage for the Hackathon Demo
// In production, replace these methods with Firebase Firestore calls.

const STORAGE_KEY = "ecolumina_user";
const LEADERBOARD_KEY = "ecolumina_leaderboard";

export const getUser = (): UserProfile => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  // Create new anonymous user
  const newUser: UserProfile = {
    id: "user_" + Math.random().toString(36).substr(2, 9),
    name: "EcoWarrior " + Math.floor(Math.random() * 1000),
    points: 0,
    scans: 0,
  };
  saveUser(newUser);
  return newUser;
};

export const saveUser = (user: UserProfile) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  updateLeaderboard(user);
};

export const addPoints = (amount: number) => {
  const user = getUser();
  user.points += amount;
  if (amount > 0) user.scans += 1;
  saveUser(user);
  return user;
};

const updateLeaderboard = (user: UserProfile) => {
  let leaderboard: UserProfile[] = [];
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) leaderboard = JSON.parse(stored);
  } catch (e) {
    leaderboard = [];
  }

  const existingIndex = leaderboard.findIndex((u) => u.id === user.id);
  if (existingIndex >= 0) {
    leaderboard[existingIndex] = user;
  } else {
    leaderboard.push(user);
  }

  // Generate fake users if empty (for demo vibes)
  if (leaderboard.length < 5) {
    leaderboard.push(
      { id: "mock1", name: "RecycleRex", points: 1250, scans: 25 },
      { id: "mock2", name: "GreenQueen", points: 980, scans: 18 },
      { id: "mock3", name: "CaptainPlanet", points: 2400, scans: 50 }
    );
  }

  // Sort by points desc
  leaderboard.sort((a, b) => b.points - a.points);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard.slice(0, 10)));
};

export const getLeaderboard = (): UserProfile[] => {
  const user = getUser(); // Ensure current user is in sync
  updateLeaderboard(user);
  const stored = localStorage.getItem(LEADERBOARD_KEY);
  return stored ? JSON.parse(stored) : [];
};