import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Camera from "../components/Camera";
import { getDIYGuide, verifyUpcycle } from "../services/gemini";
import { WorkshopGuide } from "../types";
import { addPoints, auth, saveSharedProject, getUser } from "../services/firebase";
import { shareSuccess } from "../utils/share";

const VERIFY_TIMEOUT_MS = 15000; // 15 seconds max wait for Gemini before giving up

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("VERIFY_TIMEOUT"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const Workshop: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { item: string; project: string };
  const [guide, setGuide] = useState<WorkshopGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [compliment, setCompliment] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) {
      navigate("/home");
      return;
    }

    const fetchGuide = async () => {
      const data = await getDIYGuide(state.item, state.project);
      setGuide(data);
      setLoading(false);
    };

    fetchGuide();
  }, [state, navigate]);

  const handleVerifyCapture = async (base64Image: string) => {
    // Allow verification even if Firebase auth failed (demo/guest mode)
    if (!auth.currentUser) {
      console.warn("No Firebase user found, continuing verification in demo mode (no cloud points update).");
    }

    setVerifyError(null);
    setShowCamera(false);
    setVerifying(true);

    try {
      const result = await withTimeout(
        verifyUpcycle(base64Image, state.project),
        VERIFY_TIMEOUT_MS
      );

      if (!result.is_valid) {
        setVerifyError(
          "We couldn't clearly see your finished project. Please retake a well-lit photo that shows the upcycled item from the front."
        );
        return;
      }

      // Verified: award points and show eco-card
      if (auth.currentUser) {
        await addPoints(auth.currentUser.uid, 50);
      }
      setProofImage(base64Image);
      setCompliment(result.compliment || "Awesome upcycling work! 🎉");
      setCompleted(true);

      // Confetti, best-effort
      try {
        const confettiModule = await import("canvas-confetti");
        const confetti = (confettiModule as any).default || confettiModule;
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error("Confetti failed", err);
      }

      // Save shared project to Firestore (best-effort)
      try {
        if (!auth.currentUser || !auth.currentUser.uid) {
          console.warn("[Workshop] No authenticated user for saving shared project");
          throw new Error("No authenticated user for sharing");
        }

        const originalImage = (state as any).originalImage || null;
        const userProfile = auth.currentUser ? await getUser(auth.currentUser.uid) : null;
        const savedId = await saveSharedProject({
          title: state.item,
          projectName: state.project,
          createdBy: userProfile?.name || auth.currentUser.uid,
          createdByUid: auth.currentUser.uid,
          proofImage: base64Image,
          originalImage: originalImage,
          difficulty: (guide?.difficulty as string) || "Medium",
          points: 50,
          description: result.compliment || "",
          createdAt: new Date().toISOString(),
        });

        // Generate proper shareable link using the returned document id
        if (savedId) {
          // App uses HashRouter, so include the hash fragment so links open to the correct route
          const shareLink = `${window.location.origin}/#/project/${savedId}`;
          console.log(`[Workshop] Share link created: ${shareLink}`);
          setShareableLink(shareLink);
        } else {
          throw new Error("saveSharedProject returned empty id");
        }
      } catch (err) {
        console.error("[Workshop] Failed to save shared project:", err);
        // Still create a fallback share link (non-functional project id) but log it
        const fallbackId = encodeURIComponent(state.project + "-" + Date.now());
        const shareLink = `${window.location.origin}/#/project/${fallbackId}`;
        console.warn(`[Workshop] Using fallback share link (project may not be saved): ${shareLink}`);
        setShareableLink(shareLink);
      }
    } catch (error) {
      console.error("Verification failed", error);
      const msg = (error as Error)?.message === "VERIFY_TIMEOUT"
        ? "Gemini took too long to respond. Check your connection and try again with a clear photo of the finished project."
        : "We couldn't verify your project this time. Please try again with a clearer photo of the finished item.";
      setVerifyError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleShare = async () => {
    if (!shareableLink) return;

    // when creating share message, include full link:
    const shareText = `I just built a ${state.project} using EcoLumina and earned 50 points! See it here: ${shareableLink}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My upcycle project", text: shareText, url: shareableLink });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareableLink);
        alert("Share link copied to clipboard");
      } else {
        // Fallback: open shareable link in new tab
        window.open(shareableLink, "_blank");
      }
    } catch (err) {
      console.error("Share failed", err);
      try {
        await navigator.clipboard.writeText(shareableLink);
        alert("Share link copied to clipboard");
      } catch (e) {
        window.open(shareableLink, "_blank");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Drafting blueprint...</p>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Gemini is inspecting your craft...</p>
      </div>
    );
  }

  if (!guide || !state) return null;

  if (showCamera) {
    return (
      <div className="h-full relative bg-black">
        <button
          onClick={() => setShowCamera(false)}
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md"
        >
          <span className="material-icons-round">arrow_back</span>
        </button>
        <Camera onCapture={handleVerifyCapture} skipBlurCheck />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white pb-10">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-8 rounded-b-3xl relative overflow-hidden">
        <div className="relative z-10">
           <button 
            onClick={() => navigate(-1)} 
            className="mb-6 w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition"
          >
            <span className="material-icons-round text-sm">arrow_back</span>
          </button>
          <p className="text-emerald-100 text-sm uppercase font-bold tracking-wider mb-1">Workshop</p>
          <h1 className="text-3xl font-bold max-w-xs">{state.project}</h1>
        </div>
        
        {/* Decorative circle */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
      </div>

      <div className="px-6 py-8">
        {/* Warning */}
        {guide.warning && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-8 flex items-start">
             <span className="material-icons-round text-orange-500 mr-3 mt-0.5">warning</span>
             <p className="text-orange-800 text-sm">{guide.warning}</p>
          </div>
        )}

        {/* Materials */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 text-lg mb-4">You'll Need</h3>
          <ul className="grid grid-cols-2 gap-3">
            {guide.materials.map((mat, i) => (
              <li key={i} className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                {mat}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Instructions</h3>
          <div className="space-y-6 relative border-l-2 border-gray-100 ml-3 pl-6">
            {guide.steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] w-6 h-6 bg-emerald-100 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-700">
                  {i + 1}
                </div>
                <p className="text-gray-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Verification feedback */}
          {verifyError && !completed && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
              <span className="material-icons-round text-sm mt-0.5">error_outline</span>
              <p>{verifyError}</p>
            </div>
          )}

          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
              guide.youtubeQuery
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition"
          >
            <span className="material-icons-round mr-2">play_circle</span>
            Watch Video Tutorial
          </a>

          {!completed ? (
            <button
              onClick={() => setShowCamera(true)}
              className="flex items-center justify-center w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition"
            >
              <span className="material-icons-round mr-2">photo_camera</span>
              📸 Verify &amp; Claim Points
            </button>
          ) : proofImage ? (
            <div className="space-y-4">
              {/* Eco-Card */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl overflow-hidden mb-3">
                  <img
                    src={proofImage}
                    alt="Verified upcycle project"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs uppercase tracking-wide text-emerald-600 font-bold mb-1">
                  Eco-Card
                </p>
                <h3 className="font-bold text-gray-900 mb-1">
                  I turned a {state.item} into a {state.project}!
                </h3>
                {compliment && (
                  <p className="text-sm text-gray-600 mb-2">{compliment}</p>
                )}
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                  ♻️ Upcycle Hero
                </span>
              </div>

              {shareError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                  <p className="font-bold text-sm">⚠️ Share Error</p>
                  <p className="text-xs mt-1">{shareError}</p>
                  <p className="text-xs mt-2 text-gray-600">
                    Project was saved but share link generation failed. Try copying the link manually or contact support.
                  </p>
                </div>
              )}

              <button
                onClick={handleShare}
                className="flex items-center justify-center w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition"
              >
                <span className="material-icons-round mr-2">ios_share</span>
                Share to Socials
              </button>

              <button
                onClick={() => navigate("/home")}
                className="flex items-center justify-center w-full py-3 bg-gray-100 text-gray-800 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <div className="text-center py-3 text-emerald-600 font-bold bg-emerald-50 rounded-xl">
              Project Completed! Points Added.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workshop;