"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExaminerShell from "../ExaminerShell";
import { Save, AlertCircle } from "lucide-react";

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        return "https://ai-proctored-exam-platform-iv1t.onrender.com";
      }
    }
  }
  return envUrl || "https://ai-proctored-exam-platform-iv1t.onrender.com";
};
const API_BASE = getApiBase();

export default function CreateExamPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Computer Science");
  const [instructions, setInstructions] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [durationMinutes, setDurationMinutes] = useState(60);

  const [enableProctoring, setEnableProctoring] = useState(true);
  const [webcamMonitoring, setWebcamMonitoring] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [libraries, setLibraries] = useState<{ id: string; title: string; question_count: number }[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("examiner_theme");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";
    fetch(`${API_BASE}/questions/libraries`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (data && data.length > 0) {
          setLibraries(data);
          setSubject(data[0].title.replace(/^Evaluated\s+/i, ""));
        }
      })
      .catch(() => {});
  }, []);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Please enter an exam title.");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("access_token") || "";

    try {
      const res = await fetch(`${API_BASE}/exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          total_marks: Number(totalMarks),
          passing_marks: Number(passingMarks),
          duration_minutes: Number(durationMinutes),
          instructions: instructions.trim(),
          start_time: startTime || null,
          end_time: endTime || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create examination.");
      }

      const created = await res.json();
      router.push(`/examiner/exams/${created.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not save exam.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExaminerShell title="Create Exam">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.3rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
            Create New Examination
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            Configure basic details, schedule, grading rules, and AI proctoring controls.
          </p>
        </div>

        <button
          onClick={handleSaveExam}
          disabled={saving}
          style={{
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "0.55rem 1.1rem",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: saving ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          <Save size={15} />
          {saving ? "Saving..." : "Save Exam & Next"}
        </button>
      </div>

      {errorMsg && (
        <div style={{ background: "#fee2e2", border: "1px solid #dc2626", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.82rem" }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSaveExam} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        {/* Basic Details Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.95rem 0" }}>
            1. Basic Details
          </h3>

          <div className="form-row" style={{ marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.35rem" }}>Exam Title</label>
              <input type="text" required placeholder="Example: Semester 1 Final Examination" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.35rem" }}>Subject Category Question Bank *</label>
              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.82rem", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
              >
                {libraries.length === 0 ? (
                  <option value="Computer Science">Computer Science & Programming</option>
                ) : (
                  libraries.map((lib) => {
                    const cleanTitle = lib.title.replace(/^Evaluated\s+/i, "");
                    return (
                      <option key={lib.id} value={cleanTitle}>
                        {cleanTitle} ({lib.question_count} questions)
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.35rem" }}>Exam Instructions</label>
            <textarea rows={3} placeholder="Enter candidate instructions..." value={instructions} onChange={(e) => setInstructions(e.target.value)} style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Schedule & Duration Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.95rem 0" }}>
            2. Schedule & Duration
          </h3>

          <div className="form-row-3">
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.35rem" }}>Start Time</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.35rem" }}>End Time</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.35rem" }}>Duration (Minutes)</label>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        {/* Security & AI Proctoring Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.95rem 0" }}>
            3. Security & AI Proctoring
          </h3>

          <div className="form-row">
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: innerBg, border: `1px solid ${cardBorder}`, padding: "0.65rem 0.85rem", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: textMain }}>Enable AI Proctoring</span>
              <input type="checkbox" checked={enableProctoring} onChange={(e) => setEnableProctoring(e.target.checked)} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: innerBg, border: `1px solid ${cardBorder}`, padding: "0.65rem 0.85rem", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: textMain }}>Webcam Monitoring</span>
              <input type="checkbox" checked={webcamMonitoring} onChange={(e) => setWebcamMonitoring(e.target.checked)} />
            </label>
          </div>
        </div>
      </form>
    </ExaminerShell>
  );
}