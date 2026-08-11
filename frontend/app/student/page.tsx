"use client";

import { useEffect } from "react";

export default function StudentRedirectPage() {
  useEffect(() => {
    window.location.href = "/student/dashboard";
  }, []);

  return null;
}