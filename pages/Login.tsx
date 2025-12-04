import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInAnonymousUser, signInWithGoogle, isFirebaseConfigured } from "../services/firebase";

// Minimal type for the PWA beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };

  const handleContinue = async () => {
    setError(null);

    if (!isFirebaseConfigured) {
      setError(
        "Login is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in .env.local."
      );
      return;
    }

    // If already logged in (e.g. via Google), just go to home
    if (auth.currentUser) {
      navigate("/home");
      return;
    }

    try {
      setLoadingGuest(true);
      await signInAnonymousUser();
      navigate("/home");
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err?.message || "Login failed. Please double-check your Firebase configuration.");
    } finally {
      setLoadingGuest(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);

    if (!isFirebaseConfigured) {
      setError(
        "Login is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in .env.local."
      );
      return;
    }

    // If already logged in, just go to home
    if (auth.currentUser) {
      navigate("/home");
      return;
    }

    try {
      setLoadingGoogle(true);
      await signInWithGoogle();
      navigate("/home");
    } catch (err: any) {
      console.error("Google login failed", err);
      setError(err?.message || "Google login failed. Please check your Firebase Auth settings.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-emerald-50">
      <header className="px-6 pt-16 pb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">EcoLumina</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Upcycle with AI</h1>
        </div>
        {installPromptEvent && (
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white text-emerald-700 shadow-sm hover:bg-emerald-50 border border-emerald-100"
          >
            <span className="material-icons-round text-sm mr-1">download</span>
            Install App
          </button>
        )}
      </header>

      <main className="flex-1 px-6 pb-10 flex flex-col justify-between">
        <div>
          <div className="relative h-52 rounded-3xl overflow-hidden shadow-lg mb-6">
            <img
              src="https://picsum.photos/seed/eco-lens/600/400"
              alt="Eco upcycling"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200 mb-1">Scan • Upcycle • Earn</p>
              <p className="text-lg font-semibold leading-snug">
                Turn trash into trophies
                <br />
                with EcoWarrior energy
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Sign in anonymously as an <span className="font-semibold text-emerald-700">EcoWarrior</span> to start
            scanning waste, earn points, and climb the global leaderboard.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              <div className="flex items-start gap-2">
                <span className="material-icons-round text-sm mt-0.5">error_outline</span>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGuest || loadingGoogle}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-800 border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              className="w-4 h-4 mr-2"
            />
            {loadingGoogle ? "Connecting to Google..." : "Continue with Google"}
          </button>

          <button
            onClick={handleContinue}
            disabled={loadingGuest || loadingGoogle}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            {loadingGuest ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Getting your EcoWarrior ready...
              </>
            ) : (
              <>
                <span className="material-icons-round text-base mr-2">bolt</span>
                Continue as EcoWarrior (Guest)
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-500 text-center">
            You can use Google for a richer profile, or continue as an anonymous EcoWarrior. No email required.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
