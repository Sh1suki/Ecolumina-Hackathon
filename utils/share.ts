const getShareUrl = (): string => {
  // Prefer an explicit public app URL when deployed
  // @ts-ignore Vite env typing
  const envUrl = typeof import.meta !== "undefined" ? import.meta.env.VITE_PUBLIC_APP_URL : undefined;
  if (envUrl && typeof envUrl === "string") {
    return envUrl;
  }

  // Fallback to current origin (works for localhost, ngrok, etc.)
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // Last resort fallback
  return "https://example.com";
};

export const shareSuccess = async (projectTitle: string, points?: number) => {
  const text =
    typeof points === "number"
      ? `I just built a ${projectTitle} using EcoLumina and earned ${points} points! #EcoLumina #Upcycle`
      : `I just turned trash into a ${projectTitle}! #EcoLumina`;

  const shareData: ShareData = {
    title: "EcoLumina Upcycle Success!",
    text,
    url: getShareUrl(),
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      alert("Sharing not supported on this browser, but you rock!");
    }
  } catch (err) {
    console.error("Share failed", err);
  }
};
