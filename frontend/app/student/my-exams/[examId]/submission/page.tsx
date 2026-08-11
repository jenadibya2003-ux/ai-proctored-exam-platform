"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StudentShell from "../../../StudentShell";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ExamSubmissionPage() {
  const params = useParams();
  const examId = params?.examId as string;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("student_theme");
    setIsDark(savedTheme === "dark");
  }, []);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  return (
    <StudentShell title="Exam Submission">
      <div style={{ marginBottom: "1.6rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: textMain, margin: "0 0 0.3rem 0" }}>
          Exam Submission
        </h2>
        <p style={{ fontSize: "0.85rem", color: textSub, margin: 0 }}>
          Your test response has been recorded in the platform database.
        </p>
      </div>

      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "18px", padding: "2.4rem", maxWidth: "680px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2rem" }}>
          <CheckCircle2 size={32} />
        </div>

        <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: textMain, margin: "0 0 0.6rem 0" }}>
          Exam Submission Complete
        </h3>

        <p style={{ fontSize: "0.95rem", color: textMain, margin: "0 0 0.4rem 0", lineHeight: 1.5 }}>
          Your submission for <strong>Exam #{examId}</strong> has been recorded.
        </p>

        <p style={{ fontSize: "0.88rem", color: textSub, margin: "0 0 1.8rem 0", lineHeight: 1.5 }}>
          Answers, evaluation status, marks, and examiner feedback will be connected and published by the examiner.
        </p>

        <Link
          href="/student/my-exams"
          style={{
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "10px",
            padding: "0.7rem 1.4rem",
            fontSize: "0.88rem",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <ArrowLeft size={16} /> Back to My Exams
        </Link>
      </div>
    </StudentShell>
  );
}
