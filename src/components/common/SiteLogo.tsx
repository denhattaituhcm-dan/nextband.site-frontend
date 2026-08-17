import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface SiteLogoProps {
  className?: string;
  alt?: string;
  fallbackSrc?: string;
}

const getFullLogoUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("/uploads")) {
    const apiUrl =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
    const baseUrl = apiUrl.replace("/api/v1", "");
    return `${baseUrl}${url}`;
  }
  return url;
};

export function SiteLogo({
  className,
  alt,
  fallbackSrc = "/logo.png",
}: SiteLogoProps) {
  const { settings } = useSiteSettings();
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasFallbackError, setHasFallbackError] = useState(false);

  const customLogoUrl = settings?.logoUrl?.trim()
    ? getFullLogoUrl(settings.logoUrl)
    : "";

  // Reset error state when custom logo URL changes
  useEffect(() => {
    setHasLoadError(false);
    setHasFallbackError(false);
  }, [customLogoUrl, fallbackSrc]);

  // Determine final src to render
  let logoSrc = fallbackSrc;
  if (!hasLoadError && customLogoUrl) {
    logoSrc = customLogoUrl;
  } else if (!hasFallbackError) {
    logoSrc = fallbackSrc;
  } else {
    logoSrc = "/favicon.png";
  }

  return (
    <img
      src={logoSrc}
      alt={alt || `${settings?.siteName || "NextBand"} Logo`}
      className={cn("object-contain", className)}
      onError={() => {
        if (!hasLoadError && customLogoUrl) {
          setHasLoadError(true);
        } else if (!hasFallbackError) {
          setHasFallbackError(true);
        }
      }}
    />
  );
}
