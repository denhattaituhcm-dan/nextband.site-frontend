// Global Error Boundary v3
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

// Auto-recover from stale chunks on new deployments (with reload loop guard)
window.addEventListener("vite:preloadError", (event) => {
  const CHUNK_RELOAD_KEY = "nb_chunk_reload_ts";
  const now = Date.now();
  const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);

  // Auto-reload at most once within a 15-second window
  if (!lastReload || now - lastReload > 15000) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    window.location.reload();
  } else {
    console.error("[CRITICAL_CHUNK_LOAD_FAILED] Dynamic import failed persistently after reload:", event);
  }
});

/**
 * Verifies that the global stylesheet is active in the CSSOM.
 * If Tailwind / global styles are missing, triggers a controlled single reload.
 */
function verifyGlobalStylesResilience(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return true;
  const CSS_RELOAD_KEY = "nb_css_reload_ts";

  try {
    const testEl = document.createElement("div");
    testEl.className = "hidden";
    document.head.appendChild(testEl);
    const computedDisplay = window.getComputedStyle(testEl).display;
    document.head.removeChild(testEl);

    // If .hidden class from Tailwind is not computed to "none", stylesheet is missing/unapplied
    if (computedDisplay !== "none") {
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem(CSS_RELOAD_KEY) || 0);

      if (!lastReload || now - lastReload > 15000) {
        sessionStorage.setItem(CSS_RELOAD_KEY, String(now));
        console.warn("[CSS_RESILIENCE] Stylesheet unapplied, executing controlled reload...");
        window.location.reload();
        return false;
      } else {
        console.error("[CRITICAL_CSS_RESILIENCE] Stylesheet failed to apply after reload guard.");
        return false;
      }
    }
  } catch (err) {
    console.warn("[CSS_RESILIENCE] Style verification notice:", err);
  }
  return true;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[GLOBAL_ERROR_BOUNDARY_CAUGHT]", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + window.location.pathname + "?t=" + Date.now();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/?t=" + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4"
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            padding: "1rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center space-y-6"
            style={{
              maxWidth: "28rem",
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "1rem",
              border: "1px solid #e2e8f0",
              padding: "2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
            }}
          >
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600"
              style={{
                margin: "0 auto",
                display: "flex",
                height: "4rem",
                width: "4rem",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9999px",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                color: "#d97706",
              }}
            >
              <AlertTriangle className="h-8 w-8" style={{ height: "2rem", width: "2rem" }} />
            </div>

            <div className="space-y-2" style={{ marginTop: "1rem" }}>
              <h2
                className="text-xl font-bold text-slate-900"
                style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}
              >
                Đã xảy ra sự cố hiển thị
              </h2>
              <p
                className="text-sm text-slate-500"
                style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.5rem" }}
              >
                Ứng dụng vừa gặp sự cố gián đoạn ngoài dự kiến. Vui lòng bấm làm mới trang để tiếp tục sử dụng.
              </p>
            </div>

            {this.state.error?.message && (
              <div
                className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-left overflow-auto max-h-28 text-xs font-mono text-slate-700"
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: "7rem",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "#334155",
                  marginTop: "1rem",
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div
              className="flex items-center gap-3 pt-2"
              style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}
            >
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2"
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
                onClick={this.handleGoHome}
              >
                <Home className="h-4 w-4" style={{ height: "1rem", width: "1rem" }} /> Trang chủ
              </button>
              <button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
                onClick={this.handleReload}
              >
                <RefreshCw className="h-4 w-4" style={{ height: "1rem", width: "1rem" }} /> Làm mới trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Run global styles verification before mount
verifyGlobalStylesResilience();

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </GlobalErrorBoundary>,
);
