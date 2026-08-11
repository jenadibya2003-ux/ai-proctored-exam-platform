"use client";

import { useEffect, useState } from "react";

type CheckStatus = "checking" | "ok" | "failed";

export default function ExamCheckPage() {
  const [cameraStatus, setCameraStatus] = useState<CheckStatus>("checking");
  const [micStatus, setMicStatus] = useState<CheckStatus>("checking");
  const [browserStatus, setBrowserStatus] = useState<CheckStatus>("checking");
  const [examTitle, setExamTitle] = useState("");

  useEffect(() => {
    setExamTitle(localStorage.getItem("pending_exam_title") || "your exam");

    const isSupportedBrowser =
      typeof navigator !== "undefined" &&
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices;
    setBrowserStatus(isSupportedBrowser ? "ok" : "failed");

    async function checkMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStatus("ok");
        setMicStatus("ok");
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setCameraStatus("failed");
        setMicStatus("failed");
      }
    }
    checkMedia();
  }, []);

  const allChecksPassed =
    cameraStatus === "ok" && micStatus === "ok" && browserStatus === "ok";

  function handleStartExam() {
    window.location.href = "/exam-guidelines";
  }

  function handleCancel() {
    window.location.href = "/dashboard";
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconCircle}>🖥️</div>
        <h1 style={styles.title}>Pre-Exam System Check</h1>
        <p style={styles.subtitle}>{examTitle}</p>
        <p style={styles.description}>All checks must pass before you can start the exam.</p>

        <div style={styles.checkList}>
          <CheckRow label="Camera Access" status={cameraStatus} icon="📷" />
          <CheckRow label="Microphone Access" status={micStatus} icon="🎤" />
          <CheckRow label="Browser Compatibility" status={browserStatus} icon="🌐" />
        </div>

        <div style={styles.buttonRow}>
          <button onClick={handleCancel} style={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleStartExam}
            disabled={!allChecksPassed}
            style={{
              ...styles.startButton,
              ...(allChecksPassed ? {} : styles.startButtonDisabled),
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ label, status, icon }: { label: string; status: CheckStatus; icon: string }) {
  return (
    <div
      style={{
        ...styles.checkRow,
        ...(status === "ok" ? styles.checkRowOk : {}),
        ...(status === "failed" ? styles.checkRowFailed : {}),
      }}
    >
      <span style={styles.checkIcon}>{icon}</span>
      <span style={styles.checkLabel}>{label}</span>
      <span style={styles.checkStatusIcon}>
        {status === "checking" && "…"}
        {status === "ok" && "✅"}
        {status === "failed" && "❌"}
      </span>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b1120",
    padding: "1.5rem",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "18px",
    padding: "2rem",
    textAlign: "center",
  },
  iconCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#312e81",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.6rem",
    margin: "0 auto 1rem",
  },
  title: { fontSize: "1.3rem", fontWeight: 700, color: "#ffffff", margin: "0 0 0.3rem" },
  subtitle: { fontSize: "0.9rem", color: "#94a3b8", margin: "0 0 0.2rem" },
  description: { fontSize: "0.82rem", color: "#64748b", margin: "0 0 1.4rem" },
  checkList: { display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.6rem" },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    padding: "0.8rem 1rem",
    borderRadius: "10px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    textAlign: "left",
  },
  checkRowOk: { borderColor: "#166534", background: "#052e16" },
  checkRowFailed: { borderColor: "#991b1b", background: "#450a0a" },
  checkIcon: { fontSize: "1.1rem" },
  checkLabel: { flex: 1, fontSize: "0.9rem", color: "#e2e8f0", fontWeight: 600 },
  checkStatusIcon: { fontSize: "1rem" },
  buttonRow: { display: "flex", gap: "0.7rem", justifyContent: "center" },
  cancelButton: {
    padding: "0.7rem 1.3rem",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#e2e8f0",
    fontWeight: 600,
    cursor: "pointer",
  },
  startButton: {
    padding: "0.7rem 1.3rem",
    borderRadius: "10px",
    border: "none",
    background: "#4338ca",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  startButtonDisabled: { background: "#334155", cursor: "not-allowed" },
};