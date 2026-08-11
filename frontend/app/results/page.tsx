"use client";

import { useEffect } from "react";

export default function ResultsRedirectPage() {
  useEffect(() => {
    window.location.href = "/dashboard";
  }, []);

  return null;
}