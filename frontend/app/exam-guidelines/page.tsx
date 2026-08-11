"use client";

import { useEffect, useState } from "react";

export default function ExamGuidelinesPage() {
  const [examTitle, setExamTitle] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setExamTitle(localStorage.getItem("pending_exam_title") || "your exam");
  }, []);

  function handleStart() {
    const isMock = localStorage.getItem("mock_mode") === "true";
    window.location.href = isMock ? "/mock-exam" : "/exam";
  }
  function handleBack() {
    window.location.href = "/exam-check";
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconCircle}>🛡️</div>
        <h1 style={styles.title}>Exam Guidelines</h1>
        <p style={styles.subtitle}>
          Please read these instructions carefully before starting <strong>{examTitle}</strong>.
        </p>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>👁️ What's Being Monitored</h3>
          <div style={styles.grid}>
            <InfoBox icon="📷" title="Webcam" text="Your face must be visible throughout the exam" />
            <InfoBox icon="🖥️" title="Screen Activity" text="Tab switches and window changes are tracked" />
            <InfoBox icon="🎤" title="Audio" text="Background noise and conversations are detected" />
            <InfoBox icon="👤" title="Face Detection" text="Monitors for multiple faces or absence" />
          </div>
        </section>

        <section style={{ ...styles.section, ...styles.dangerSection }}>
          <h3 style={{ ...styles.sectionTitle, color: "#fca5a5" }}>🚫 Not Allowed During Exam</h3>
          <div style={styles.grid}>
            <InfoBox icon="📱" title="Mobile Phones" text="Keep all devices away from your workspace" danger />
            <InfoBox icon="🔀" title="Switching Tabs" text="Do not open other websites or applications" danger />
            <InfoBox icon="🗣️" title="Talking" text="No conversations or reading questions aloud" danger />
            <InfoBox icon="🚷" title="External Help" text="No books, notes, or other people assisting" danger />
          </div>
        </section>

        <section style={styles.warningBox}>
          <div style={styles.warningTitle}>⚠️ Warning System</div>
          <p style={styles.warningText}>
            If you violate any rule, you will receive a warning popup. Each warning is recorded.
          </p>
          <div style={styles.warningHighlight}>
            ⚠️ After 5 warnings, your exam will be automatically submitted.
          </div>
        </section>

        <section style={{ ...styles.section, ...styles.successSection }}>
          <h3 style={{ ...styles.sectionTitle, color: "#86efac" }}>✅ Tips for Success</h3>
          <div style={styles.grid}>
            <InfoBox icon="📶" title="Stable Internet" text="Ensure a strong connection before starting" />
            <InfoBox icon="⛶" title="Fullscreen Mode" text="Keep the browser in fullscreen throughout" />
            <InfoBox icon="⏱️" title="Time Management" text="Watch the timer — pace yourself wisely" />
            <InfoBox icon="🚩" title="Mark for Review" text="Flag tricky questions and come back later" />
          </div>
        </section>

        <label style={styles.agreeRow}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={styles.checkbox}
          />
          <span>
            I have read and understood all the guidelines above. I agree to follow the exam
            rules and understand that violations will result in warnings and potential
            auto-submission of my exam.
          </span>
        </label>

        <div style={styles.buttonRow}>
          <button onClick={handleBack} style={styles.backButton}>
            ← Back
          </button>
          <button
            onClick={handleStart}
            disabled={!agreed}
            style={{
              ...styles.startButton,
              ...(agreed ? {} : styles.startButtonDisabled),
            }}
          >
            ✓ I Understand — Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  icon,
  title,
  text,
  danger,
}: {
  icon: string;
  title: string;
  text: string;
  danger?: boolean;
}) {
  return (
    <div style={{ ...styles.infoBox, ...(danger ? styles.infoBoxDanger : {}) }}>
      <div style={styles.infoBoxHeader}>
        <span>{icon}</span>
        <span style={styles.infoBoxTitle}>{title}</span>
      </div>
      <div style={styles.infoBoxText}>{text}</div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    background: "#0b1120",
    padding: "2rem 1.5rem",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "640px",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "18px",
    padding: "2rem",
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
  title: { fontSize: "1.3rem", fontWeight: 700, color: "#ffffff", margin: "0 0 0.4rem", textAlign: "center" },
  subtitle: { fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 1.6rem", textAlign: "center" },
  section: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  dangerSection: { borderColor: "#7f1d1d", background: "#1c0a0a" },
  successSection: { borderColor: "#14532d", background: "#0a170e" },
  sectionTitle: { fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0", margin: "0 0 0.8rem" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" },
  infoBox: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    padding: "0.6rem 0.8rem",
  },
  infoBoxDanger: { borderColor: "#450a0a" },
  infoBoxHeader: { display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" },
  infoBoxTitle: { fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" },
  infoBoxText: { fontSize: "0.72rem", color: "#64748b" },
  warningBox: {
    background: "#1c1408",
    border: "1px solid #92400e",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  warningTitle: { fontSize: "0.9rem", fontWeight: 700, color: "#fbbf24", marginBottom: "0.4rem" },
  warningText: { fontSize: "0.8rem", color: "#d4a04a", margin: "0 0 0.6rem" },
  warningHighlight: {
    fontSize: "0.8rem",
    color: "#fbbf24",
    fontWeight: 600,
    background: "#292008",
    padding: "0.5rem 0.7rem",
    borderRadius: "8px",
  },
  agreeRow: {
    display: "flex",
    gap: "0.6rem",
    fontSize: "0.78rem",
    color: "#94a3b8",
    lineHeight: 1.5,
    marginBottom: "1.4rem",
  },
  checkbox: { marginTop: "0.2rem", accentColor: "#4338ca", flexShrink: 0 },
  buttonRow: { display: "flex", justifyContent: "space-between" },
  backButton: {
    padding: "0.7rem 1.2rem",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#e2e8f0",
    fontWeight: 600,
    cursor: "pointer",
  },
  startButton: {
    padding: "0.7rem 1.2rem",
    borderRadius: "10px",
    border: "none",
    background: "#4338ca",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  startButtonDisabled: { background: "#334155", cursor: "not-allowed" },
};