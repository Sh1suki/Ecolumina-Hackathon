import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged as fbOnAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, increment, getDoc, onSnapshot, collection, query, orderBy, limit, FirestoreError, getDocs, where } from "firebase/firestore";
import { UserProfile } from "../types";
import * as localDb from "./localDb";

// Helper to safely get env vars in different environments (Vite vs Node/Process)
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
  } catch (e) {}
  
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

const coreFirebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
};

// We treat these four keys as required for proper login functionality
export const isFirebaseConfigured = Object.values(coreFirebaseConfig).every(Boolean);

if (!isFirebaseConfigured) {
  console.warn(
    "Firebase is not fully configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in your environment (.env.local for Vite)."
  );
}

// Decide whether to use localStorage fallback (dev) or Firestore
// Use the getEnv helper so this works in Vite and other environments
export const useLocalDb = (getEnv('VITE_USE_LOCAL_DB') === 'true') || !isFirebaseConfigured;
if (useLocalDb) {
  console.log('[Firebase] Using localStorage DB fallback (VITE_USE_LOCAL_DB=true or missing config)');
} else {
  console.log('[Firebase] Using remote Firestore DB');
}

const firebaseConfig = {
  ...coreFirebaseConfig,
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
};

// Initialize Firebase only when properly configured
let app: any = null;
let _auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig as any);
  _auth = getAuth(app);
  db = getFirestore(app);

  console.log("[Firebase] Initialized", {
    projectId: coreFirebaseConfig.projectId,
    authDomain: coreFirebaseConfig.authDomain,
    isConfigured: isFirebaseConfigured,
  });
} else {
  console.warn("[Firebase] Skipping initializeApp because firebase is not configured");
}

// Export an `auth` object that is either the real Firebase Auth or a lightweight mock
const authMock = {
  get currentUser() {
    const u = localAuth.currentUser;
    if (!u) return null;
    return { uid: u.uid, isAnonymous: u.isAnonymous, displayName: (u as any).displayName || null } as any;
  },
};

export const auth = isFirebaseConfigured && _auth ? _auth : (authMock as any);
export { db };

// Auth providers
const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : null;
if (googleProvider) googleProvider.setCustomParameters({ prompt: "select_account" });

// --- Local mock auth for dev when Firebase is not configured ---
type LocalUser = { uid: string; isAnonymous: boolean; displayName?: string } | null;
const localAuth = {
  currentUser: null as LocalUser,
  subscribers: new Set<(user: LocalUser) => void>(),
  setCurrent(user: LocalUser) {
    this.currentUser = user;
    this.subscribers.forEach((cb) => cb(user));
  },
  subscribe(cb: (user: LocalUser) => void) {
    this.subscribers.add(cb);
    // call immediately
    cb(this.currentUser);
    return () => this.subscribers.delete(cb);
  },
};

// Auth Service
export const signInAnonymousUser = async (): Promise<User> => {
  // If Firebase is configured, use the real SDK
  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // Check if user doc exists, if not create it
      const userRef = doc(db, "users", user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (error) {
        console.warn("Failed to fetch user doc after anonymous sign-in (continuing anyway):", error);
      }

      if (!userSnap || !userSnap.exists()) {
        const newUserProfile: UserProfile = {
          id: user.uid,
          name: `EcoWarrior ${user.uid.slice(0, 4)}`,
          points: 0,
          scans: 0,
        };
        try {
          await setDoc(userRef, newUserProfile);
        } catch (error) {
          console.warn("Failed to create user doc after anonymous sign-in (offline or Firestore issue):", error);
        }
      }

      return user;
    } catch (error) {
      console.error("Anonymous auth error:", error);
      throw error;
    }
  }

  // Local fallback: create a fake user and persist to localDb
  const fakeUid = `local_${Date.now()}`;
  const fakeUser = { uid: fakeUid, isAnonymous: true } as any;
  await localDb.saveUser({ id: fakeUid, name: `EcoWarrior ${fakeUid.slice(6, 10)}`, points: 0, scans: 0 });
  localAuth.setCurrent({ uid: fakeUid, isAnonymous: true });
  return fakeUser as any;
};

export const signInWithGoogle = async (): Promise<User> => {
  // If Firebase is configured, use real Google popup
  if (isFirebaseConfigured && auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider as any);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (error) {
        console.warn("Failed to fetch user doc after Google sign-in (continuing anyway):", error);
      }

      if (!userSnap || !userSnap.exists()) {
        const newUserProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || `EcoWarrior ${user.uid.slice(0, 4)}`,
          points: 0,
          scans: 0,
        };
        try {
          await setDoc(userRef, newUserProfile);
          console.log(`[Firebase] Created user doc for ${user.uid}`);
        } catch (error) {
          console.error("Failed to create user doc after Google sign-in:", error);
          // Still return user even if doc creation fails - Home will use fallback
        }
      } else {
        console.log(`[Firebase] User doc already exists for ${user.uid}`);
      }

      return user;
    } catch (error) {
      console.error("Google auth error:", error);
      throw error;
    }
  }

  // Local fallback Google sign-in (mock)
  const fakeUid = `local_google_${Date.now()}`;
  const fakeUser = { uid: fakeUid, isAnonymous: false, displayName: "Local Google User" } as any;
  await localDb.saveUser({ id: fakeUid, name: fakeUser.displayName, points: 0, scans: 0 });
  localAuth.setCurrent({ uid: fakeUid, isAnonymous: false, displayName: fakeUser.displayName });
  return fakeUser as any;
};

export const logout = async () => {
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
    return;
  }

  // local logout
  localAuth.setCurrent(null);
};

// Database Service
const addPointsFirestore = async (uid: string, amount: number) => {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    points: increment(amount),
    scans: increment(amount > 0 ? 1 : 0),
  });
};

export const addPoints = async (uid: string, pointsToAdd: number) => {
  // Local DB path
  if (useLocalDb) {
    try {
      return await localDb.addPoints(uid, pointsToAdd);
    } catch (err) {
      console.error("[localDb] addPoints error:", err);
      throw err;
    }
  }

  // Firestore: use atomic increment to avoid race conditions
  try {
    await addPointsFirestore(uid, pointsToAdd);
    return;
  } catch (error) {
    console.error("[Firebase] addPoints error:", error);
    throw error;
  }
};

// Firestore get/save helpers (used by adapter)
const getUserFirestore = async (uid: string) => {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  try {
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (err) {
    console.warn('[Firestore] getUser error', err);
    return null;
  }
};

const saveUserFirestore = async (user: Partial<UserProfile> & { id: string }) => {
  if (!user || !user.id) return null;
  const userRef = doc(db, "users", user.id);
  try {
    await setDoc(userRef, user, { merge: true });
    return user;
  } catch (err) {
    console.warn('[Firestore] saveUser error', err);
    return null;
  }
};

const updateUserLocationFirestore = async (uid: string, location: Partial<UserProfile>) => {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  try {
    // Use setDoc with merge: true to create document if it doesn't exist, or update if it does
    await setDoc(userRef, location, { merge: true });
  } catch (err) {
    console.warn('[Firestore] updateUserLocation error', err);
    throw err;
  }
};

const subscribeToUserFirestore = (
  uid: string,
  callback: (data: UserProfile) => void,
  onError?: (error: FirestoreError) => void
) => {
  const userRef = doc(db, "users", uid);
  console.log("[Firestore] Subscribing to user doc", uid);

  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        console.log("[Firestore] User doc snapshot received", docSnap.data());
        callback(docSnap.data() as UserProfile);
      } else {
        console.warn("[Firestore] User doc missing, using fallback profile", uid);
        const fallbackProfile: UserProfile = {
          id: uid,
          name: `EcoWarrior ${uid.slice(0, 4)}`,
          points: 0,
          scans: 0,
        };
        callback(fallbackProfile);
      }
    },
    (error) => {
      console.error("User subscription error:", error);
      if (onError) {
        onError(error as FirestoreError);
      }
    }
  );
};

const subscribeToLeaderboardFirestore = (callback: (data: UserProfile[]) => void) => {
  const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      users.push({
        id: docSnap.id,
        name: data.name || "Anonymous",
        points: data.points || 0,
        scans: data.scans || 0,
        country: data.country,
        province: data.province,
        city: data.city,
        barangay: data.barangay,
      } as UserProfile);
    });
    callback(users);
  });
};

// Exported wrappers that delegate to localDb when configured
export const subscribeToUser = (
  uid: string,
  callback: (data: UserProfile) => void,
  onError?: (error: FirestoreError) => void
) => {
  return useLocalDb
    ? localDb.subscribeToUser(uid, callback)
    : subscribeToUserFirestore(uid, callback, onError);
};

export const subscribeToLeaderboard = (callback: (data: UserProfile[]) => void) => {
  return useLocalDb ? localDb.subscribeToLeaderboard(callback) : subscribeToLeaderboardFirestore(callback);
};

export const getUser = (uid: string) => {
  return useLocalDb ? localDb.getUser(uid) : getUserFirestore(uid);
};

export const saveUser = (user: Partial<UserProfile> & { id: string }) => {
  return useLocalDb ? localDb.saveUser(user) : saveUserFirestore(user);
};

export const updateUserLocation = (uid: string, location: Partial<UserProfile>) => {
  return useLocalDb ? localDb.saveUser({ ...location, id: uid }) : updateUserLocationFirestore(uid, location);
};

// Auth state change wrapper: uses Firebase SDK when available, otherwise local mock
export const onAuthStateChanged = (cb: (user: any) => void) => {
  if (isFirebaseConfigured && auth) {
    // use firebase sdk
    return fbOnAuthStateChanged(auth, cb as any);
  }

  // local mock subscription
  const unsub = localAuth.subscribe((u) => {
    // convert local user to minimal shape similar to Firebase User
    if (!u) {
      cb(null);
    } else {
      cb({ uid: u.uid, isAnonymous: u.isAnonymous, displayName: (u as any).displayName || null });
    }
  });
  return unsub;
};

// ============ LEADERBOARD ============
export async function fetchLeaderboard(topN: number = 50) {
  try {
    // Query the users collection as the single source of truth for points
    const q = query(
      collection(db, "users"),
      orderBy("points", "desc"),
      limit(topN)
    );
    const snapshot = await getDocs(q);

    // Use snapshot.docs so we can get an index for rank
    const users = snapshot.docs.map((docSnap, idx) => {
      const data = docSnap.data() as any;
      return {
        uid: docSnap.id,
        name: data.name || "Anonymous",
        points: data.points || 0,
        projectCount: data.projectCount || 0,
        rank: idx + 1,
      };
    });

    return users;
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return [];
  }
}

export async function updateLeaderboardUser(uid: string, points: number, projectCount: number) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    await setDoc(
      doc(db, "leaderboard", uid),
      {
        name: user.displayName || "Anonymous",
        points,
        projectCount,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to update leaderboard:", error);
  }
}

// ============ SHARED PROJECTS ============
export interface SharedProject {
  id: string;
  title: string;
  projectName: string;
  createdBy: string;
  createdByUid: string;
  createdAt: string;
  proofImage: string;
  originalImage: string;
  difficulty: string;
  points: number;
  description?: string;
}

/**
 * Fetch a single shared project by ID (publicly readable)
 */
export async function fetchSharedProject(projectId: string): Promise<SharedProject | null> {
  try {
    console.log("[Firebase] fetchSharedProject called with ID:", projectId);

    // Ensure we're using the real Firestore instance, not a mock
    if (useLocalDb || !db) {
      console.warn("[Firebase] Using local/mock DB, fetchSharedProject may not work");
      return null;
    }

    const docRef = doc(db, "sharedProjects", projectId);
    console.log("[Firebase] Doc reference created:", docRef.path);

    const docSnap = await getDoc(docRef);
    console.log("[Firebase] getDoc completed. Exists:", docSnap.exists());

    if (!docSnap.exists()) {
      console.warn("[Firebase] Document does not exist:", projectId);
      return null;
    }

    const data = docSnap.data();
    console.log("[Firebase] Document data retrieved:", data);

    const project: SharedProject = {
      id: docSnap.id,
      title: data.title || "",
      projectName: data.projectName || "",
      createdBy: data.createdBy || "Anonymous",
      createdByUid: data.createdByUid || "",
      createdAt: data.createdAt || new Date().toISOString(),
      proofImage: data.proofImage || "",
      originalImage: data.originalImage || "",
      difficulty: data.difficulty || "Medium",
      points: data.points || 0,
      description: data.description || "",
    };

    console.log("[Firebase] Project successfully mapped:", project);
    return project;

  } catch (error) {
    console.error("[Firebase] fetchSharedProject error:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Error message:", error.message);
      console.error("[Firebase] Error code:", (error as any).code);
    }
    return null;
  }
}

export async function fetchUserProjects(uid: string): Promise<SharedProject[]> {
  try {
    const q = query(
      collection(db, "sharedProjects"),
      where("createdByUid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const projects: SharedProject[] = [];
    snapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as SharedProject);
    });
    return projects;
  } catch (error) {
    console.error("Failed to fetch user projects:", error);
    return [];
  }
}

export async function saveSharedProject(projectData: Omit<SharedProject, "id">) {
  try {
    const user = auth.currentUser;
    console.log("[Firebase] saveSharedProject called. Auth:", { uid: user?.uid, isNull: !user });

    if (!user) {
      throw new Error("Not authenticated. Please sign in before sharing.");
    }
    if (!user.uid) {
      throw new Error("User UID missing. Try signing out and back in.");
    }

    const projectId = `${user.uid}_${Date.now()}`;
    console.log("[Firebase] Creating project with ID:", projectId);

    await setDoc(doc(db, "sharedProjects", projectId), {
      ...projectData,
      createdByUid: user.uid,
      createdAt: new Date().toISOString(),
    });

    console.log("[Firebase] Successfully saved shared project:", projectId);
    return projectId;

  } catch (error) {
    console.error("[Firebase] saveSharedProject error:", error);
    throw error; // Important: re-throw so Workshop can catch
  }
}