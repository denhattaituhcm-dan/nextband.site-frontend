import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface SiteLogoProps {
  className?: string;
  alt?: string;
  fallbackSrc?: string;
}

export const getFullLogoUrl = (url: unknown): string => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";

  // If already full http/https URL
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    // If in production HTTPS and URL points to localhost, strip host to avoid blocked mixed content / dead connections
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      trimmed.startsWith("http://localhost")
    ) {
      const pathOnly = trimmed.replace(/^http:\/\/localhost(:\d+)?/, "");
      return pathOnly || "";
    }
    return trimmed;
  }

  // If relative uploads path
  if (trimmed.startsWith("/uploads")) {
    const apiUrl =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
    return `${baseUrl}${trimmed}`;
  }

  return trimmed;
};

const DEFAULT_FALLBACKS = [
  "/Logo.png",
  "/favicon.png",
  "/favicon-96x96.png",
  "/favicon.svg",
];

export function SiteLogo({
  className,
  alt,
  fallbackSrc = "/Logo.png",
}: SiteLogoProps) {
  const { settings } = useSiteSettings();
  const [displayedSrc, setDisplayedSrc] = useState<string>(fallbackSrc);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const isPreloadingRef = useRef<string | null>(null);

  const customLogoUrl = settings?.logoUrl ? getFullLogoUrl(settings.logoUrl) : "";

  // List of fallback URLs with current fallbackSrc at the front
  const fallbacks = [
    fallbackSrc,
    ...DEFAULT_FALLBACKS.filter((src) => src !== fallbackSrc),
  ];

  // When customLogoUrl changes, preload it in the background first
  // NEVER switch displayedSrc to an unverified URL directly to avoid broken icons & latency
  useEffect(() => {
    if (!customLogoUrl || customLogoUrl === displayedSrc) {
      return;
    }

    isPreloadingRef.current = customLogoUrl;
    const testImg = new Image();
    testImg.src = customLogoUrl;

    testImg.onload = () => {
      // Only apply if this is still the active requested custom logo
      if (isPreloadingRef.current === customLogoUrl) {
        setDisplayedSrc(customLogoUrl);
      }
    };

    testImg.onerror = () => {
      // If remote image fails to load, do NOT break the UI — keep the existing working logo
      if (isPreloadingRef.current === customLogoUrl) {
        isPreloadingRef.current = null;
      }
    };

    return () => {
      isPreloadingRef.current = null;
    };
  }, [customLogoUrl, displayedSrc]);

  // Handle direct <img> loading errors gracefully
  const handleImgError = () => {
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < fallbacks.length) {
      setFallbackIndex(nextIndex);
      setDisplayedSrc(fallbacks[nextIndex]);
    }
  };

  return (
    <img
      src={displayedSrc}
      alt={alt || `${settings?.siteName || "ARIS IELTS"} Logo`}
      className={cn("object-contain select-none", className)}
      loading="eager"
      decoding="async"
      // @ts-ignore
      fetchPriority="high"
      onError={handleImgError}
    />
  );
}
