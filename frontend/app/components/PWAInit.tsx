"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function PWAInit() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("ServiceWorker registered:", reg.scope))
          .catch((err) => console.log("ServiceWorker registration failed:", err));
      });
    }

    // Capture beforeinstallprompt event for PWA install button
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        zIndex: 9999,
        background: "#0f172a",
        color: "#ffffff",
        border: "1px solid #3b82f6",
        borderRadius: "12px",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Install App</span>
        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Install on Phone or Laptop for offline access</span>
      </div>
      <button
        onClick={handleInstallClick}
        style={{
          background: "#2563eb",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "0.4rem 0.75rem",
          fontWeight: 700,
          fontSize: "0.78rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        <Download size={14} />
        <span>Install</span>
      </button>
    </div>
  );
}
