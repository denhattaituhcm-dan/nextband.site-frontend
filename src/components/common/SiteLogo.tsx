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
  fallbackSrc = "/Logo.png",
}: SiteLogoProps) {
  const { settings } = useSiteSettings();
  const [hasLoadError, setHasLoadError] = useState(false);

  const customLogoUrl = settings?.logoUrl?.trim()
    ? getFullLogoUrl(settings.logoUrl)
    : "";

  // Reset error state when custom logo URL changes
  useEffect(() => {
    setHasLoadError(false);
  }, [customLogoUrl, fallbackSrc]);

  // Determine final src to render
  const logoSrc = !hasLoadError && customLogoUrl ? customLogoUrl : fallbackSrc;

  return (
    <img
      src={logoSrc}
      alt={alt || `${settings?.siteName || "NextBand"} Logo`}
      className={cn("object-contain", className)}
      onError={() => {
        // If loading custom logo failed, fall back to fallbackSrc.
        // If fallbackSrc itself fails, do nothing further to avoid infinite loop.
        setHasLoadError(true);
      }}
    />
  );
}
