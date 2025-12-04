import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, subscribeToUser, isFirebaseConfigured, logout, updateUserLocation, useLocalDb, fetchLeaderboard, subscribeToLeaderboard } from "../services/firebase";
import { UserProfile } from "../types";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  // Location capture state (for logged-in Google users in the Philippines)
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("Philippines");

  // Subscribe to the current authenticated user
  useEffect(() => {
    const init = () => {
      if (!isFirebaseConfigured && !useLocalDb) {
        setError(
          "Login is not configured. Set your Firebase environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in .env.local."
        );
        setLoading(false);
        return;
      }

      const uid = auth.currentUser?.uid;
      if (!uid) {
        // No logged-in user; send back to login screen
        navigate("/");
        return;
      }

      // Show a fast local fallback profile immediately while Firestore loads
      setUser((prev) =>
        prev || {
          id: uid,
          name: "EcoWarrior",
          points: 0,
          scans: 0,
        }
      );
      setLoading(false);

      const unsubscribe = subscribeToUser(
        uid,
        (data) => {
          setUser(data);
          // loading is already false from the fallback, so no need to set it here

          // If this is a Google user (not anonymous) and they have no location yet, show the location form
          const current = auth.currentUser;
          const isGoogleUser = current && !current.isAnonymous;
          const missingLocation = !data.country || data.country.trim() === "";
          if (isGoogleUser && missingLocation) {
            setShowLocationForm(true);
            setBarangay(data.barangay || "");
            setCity(data.city || "");
            setZip(data.zip || "");
            setProvince(data.province || "");
            setCountry(data.country || "Philippines");
          }
        },
        (err) => {
          console.error("Failed to subscribe to user profile (Firestore offline?):", err);
          // Provide a basic fallback profile so the UI is usable even when Firestore is offline
          setUser((prev) =>
            prev || {
              id: uid,
              name: "EcoWarrior (Offline)",
              points: 0,
              scans: 0,
            }
          );
          setError(
            "We couldn't sync your profile with the server. You're in offline/demo mode – scans and points may not be saved."
          );
          setLoading(false);
        }
      );

      return unsubscribe;
    };

    const unsub = init();
    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, [navigate]);

  // Fetch leaderboard once and subscribe for live updates so we can compute rank
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const list = await fetchLeaderboard(50);
        if (!cancelled) setLeaderboard(list as any);
        const uid = auth.currentUser?.uid;
        if (uid) {
          const idx = (list || []).findIndex((u: any) => u.id === uid || u.uid === uid);
          setRank(idx >= 0 ? idx + 1 : null);
        }
      } catch (err) {
        console.warn("Failed to load leaderboard for rank", err);
      }
    };

    load();

    const unsub = subscribeToLeaderboard((data) => {
      if (cancelled) return;
      setLeaderboard(data as UserProfile[]);
      const uid = auth.currentUser?.uid;
      if (uid) {
        const idx = (data || []).findIndex((u) => u.id === uid || (u as any).uid === uid);
        setRank(idx >= 0 ? idx + 1 : null);
      }
    });

    return () => {
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Save location handler
  const handleSaveLocation = async () => {
    setLocationError(null);
    setLocationSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("No authenticated user");

      await updateUserLocation(uid, {
        country,
        province,
        city,
        barangay,
        zip,
      } as any);

      setShowLocationForm(false);
    } catch (err: any) {
      console.error("Failed to save location:", err);
      setLocationError(err?.message || "Failed to save location. Please try again.");
    } finally {
      setLocationSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-emerald-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-emerald-50 px-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Setup Needed</h1>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <p className="text-gray-500 text-xs max-w-sm">
          After adding these keys to your <code>.env.local</code> file, restart the dev server and reload the app.
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-full bg-emerald-50/50">
      {/* Location overlay for Google users in the Philippines */}
      {showLocationForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Where are you in the Philippines?</h2>
            <p className="text-xs text-gray-500">
              Share your location so we can understand where EcoWarriors are making an impact. This is optional and only used
              to improve the experience.
            </p>

            {locationError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                <div className="flex items-start gap-1">
                  <span className="material-icons-round text-sm mt-0.5">error_outline</span>
                  <p>{locationError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div>
                <label className="block text-gray-600 mb-1">Barangay</label>
                <input
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Barangay 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1">City / Municipality</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Quezon City"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">ZIP Code</label>
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 1100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1">Province</label>
                  <input
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Metro Manila"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Country</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLocationForm(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={locationSaving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {locationSaving ? "Saving..." : "Save Location"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-6 pt-12 pb-8 bg-white rounded-b-3xl shadow-sm">
        <div className="flex justify-between items-start mb-6 relative">
          <div>
            <p className="text-gray-500 text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white"
              aria-label="Open profile menu"
            >
              {(user.name || "E").charAt(0)}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-30">
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                    navigate("/");
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="material-icons-round text-base mr-2">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Impact</p>
              <h2 className="text-3xl font-bold mt-1">{user.points} <span className="text-lg font-normal opacity-80">pts</span></h2>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <span className="material-icons-round text-2xl">eco</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex gap-6">
            <div>
              <p className="text-xs text-emerald-100 uppercase tracking-wider">Scans</p>
              <p className="font-semibold text-lg">{user.scans}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-100 uppercase tracking-wider">Rank</p>
              {rank ? (
                <div className="flex items-center gap-2">
                  {rank === 1 ? (
                    <span className="text-yellow-400 text-2xl">🏆</span>
                  ) : rank === 2 ? (
                    <span className="text-gray-400 text-2xl">🥈</span>
                  ) : rank === 3 ? (
                    <span className="text-orange-400 text-2xl">🥉</span>
                  ) : (
                    <span className="font-semibold text-lg">#{rank}</span>
                  )}
                  <span className="text-sm text-emerald-100 opacity-90">{rank <= 3 ? "Top" : ""}</span>
                </div>
              ) : (
                <p className="font-semibold text-lg">See Leaderboard</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Actions */}
      <div className="px-6 py-6 space-y-4">
        <h3 className="font-bold text-gray-800 text-lg">Start Action</h3>
        
        <Link to="/scan" className="group relative block w-full h-40 rounded-2xl overflow-hidden shadow-md">
           <img 
             src="https://picsum.photos/seed/recycle/400/200" 
             className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
             alt="Scan Waste"
           />
           <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
           <div className="absolute bottom-0 left-0 p-5">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2">
                <span className="material-icons-round text-emerald-600">center_focus_strong</span>
             </div>
             <h4 className="text-white font-bold text-xl">Scan Waste</h4>
             <p className="text-gray-200 text-sm">Identify & Recycle</p>
           </div>
        </Link>

        <div className="grid grid-cols-2 gap-4">
            <Link to="/leaderboard" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
               <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-orange-600">
                  <span className="material-icons-round">emoji_events</span>
               </div>
               <h4 className="font-bold text-gray-800">Leaderboard</h4>
               <p className="text-xs text-gray-500 mt-1">Check your rank</p>
            </Link>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 opacity-60">
               <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
                  <span className="material-icons-round">map</span>
               </div>
               <h4 className="font-bold text-gray-800">Centers</h4>
               <p className="text-xs text-gray-500 mt-1">Coming Soon</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;