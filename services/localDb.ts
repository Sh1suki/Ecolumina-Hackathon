// Simple localStorage-based DB for development/demo
import { UserProfile } from "../types";

const USERS_KEY = "ecolumina_users_v1";

function loadUsers(): Record<string, UserProfile> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch (e) {
    console.warn("localDb: failed to parse users", e);
    return {};
  }
}

function saveUsers(data: Record<string, UserProfile>) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("localDb: failed to save users", e);
  }
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const users = loadUsers();
  return users[uid] || null;
}

export async function saveUser(user: Partial<UserProfile> & { id: string }): Promise<UserProfile | null> {
  const users = loadUsers();
  const prev = users[user.id] || { id: user.id, name: user.name || `EcoWarrior ${user.id.slice(0,4)}`, points: 0, scans: 0 };
  const merged = { ...prev, ...user } as UserProfile;
  users[user.id] = merged;
  saveUsers(users);
  return merged;
}

export async function addPoints(uid: string, amount: number): Promise<UserProfile | null> {
  if (!uid) return null;
  const users = loadUsers();
  const u = users[uid] || { id: uid, name: `EcoWarrior ${uid.slice(0,4)}`, points: 0, scans: 0 } as UserProfile;
  u.points = (u.points || 0) + amount;
  if (amount > 0) u.scans = (u.scans || 0) + 1;
  users[uid] = u;
  saveUsers(users);
  return u;
}

export async function getLeaderboard(limit = 10): Promise<UserProfile[]> {
  const users = Object.values(loadUsers());
  users.sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
  return users.slice(0, limit);
}

export function subscribeToUser(uid: string, cb: (u: UserProfile) => void) {
  let last = JSON.stringify(loadUsers()[uid] || null);
  const iv = window.setInterval(() => {
    const u = loadUsers()[uid] || null;
    const s = JSON.stringify(u);
    if (s !== last) {
      last = s;
      cb(u as UserProfile);
    }
  }, 800);
  return () => clearInterval(iv);
}

export function subscribeToLeaderboard(cb: (list: UserProfile[]) => void, interval = 1500) {
  let last = "";
  const iv = window.setInterval(() => {
    const list = Object.values(loadUsers()).sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
    const s = JSON.stringify(list);
    if (s !== last) {
      last = s;
      cb(list as UserProfile[]);
    }
  }, interval);
  return () => clearInterval(iv);
}
