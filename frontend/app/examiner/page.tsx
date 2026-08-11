"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExaminerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/examiner/dashboard");
  }, [router]);

  return null;
}
