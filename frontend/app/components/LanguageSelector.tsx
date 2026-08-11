"use client";

import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";

export type LanguageCode = "en" | "hi" | "or" | "ta" | "te" | "kn";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
];

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>("en");

  useEffect(() => {
    const readSavedLang = (): LanguageCode => {
      const saved = localStorage.getItem("preferred_language") as LanguageCode;
      if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;

      const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="))
        ?.split("=")[1];

      if (cookieValue) {
        const parts = cookieValue.split("/");
        const lang = parts[parts.length - 1] as LanguageCode;
        if (LANGUAGES.some((l) => l.code === lang)) return lang;
      }
      return "en";
    };

    const initial = readSavedLang();
    setCurrentLang(initial);
  }, []);

  const changeLanguage = (langCode: LanguageCode) => {
    setCurrentLang(langCode);
    localStorage.setItem("preferred_language", langCode);

    if (langCode === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      if (typeof window !== "undefined") {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    } else {
      document.cookie = `googtrans=/auto/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
    }

    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change"));
    }

    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }} className="notranslate">
      <Globe size={15} style={{ color: "#3b82f6" }} />
      <select
        value={currentLang}
        onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
        style={{
          background: "transparent",
          border: "1px solid #3b82f6",
          color: "#3b82f6",
          borderRadius: "8px",
          padding: "0.35rem 0.6rem",
          fontSize: "0.78rem",
          fontWeight: 700,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} style={{ background: "#0f172a", color: "#ffffff" }}>
            {l.nativeName} ({l.name})
          </option>
        ))}
      </select>
    </div>
  );
}
