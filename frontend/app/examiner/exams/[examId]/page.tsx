"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ExaminerShell from "../../ExaminerShell";
import { Plus, Layers, Trash2, BookOpen, Upload, Sparkles, X } from "lucide-react";

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `http://${host}:8000`;
    }
  }
  return envUrl || "https://ai-proctored-exam-platform-iv1t.onrender.com";
};
const API_BASE = getApiBase();

type Section = {
  id: string;
  title: string;
  library_id: string;
  subject: string;
  section_order: number;
  question_limit: number;
  total_marks: number;
  negative_marks: number;
  randomize_questions: boolean;
  creation_mode?: "library" | "bulk" | "ai";
};

type Library = {
  id: string;
  title: string;
  purpose: string | null;
  question_count: number;
};

export default function ExamBuilderPage() {
  const params = useParams();
  const examId = params?.examId as string;

  const [examTitle, setExamTitle] = useState("Semester Exam");
  const [examStatus, setExamStatus] = useState("Draft");
  const [sections, setSections] = useState<Section[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isDark, setIsDark] = useState(false);

  // Question Sourcing Mode: 'library' | 'bulk' | 'ai'
  const [sourceMode, setSourceMode] = useState<"library" | "bulk" | "ai">("library");

  // Section Form State
  const [sectionTitle, setSectionTitle] = useState("");
  const [selectedLibraryId, setSelectedLibraryId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sectionOrder, setSectionOrder] = useState(1);
  const [questionLimit, setQuestionLimit] = useState(10);
  const [sectionMarks, setSectionMarks] = useState(20);
  const [sectionNegativeMarks, setSectionNegativeMarks] = useState(0.5);
  const [randomize, setRandomize] = useState(true);

  // AI Generation Mode state
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [aiPromptTopic, setAiPromptTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Bulk Import state
  const [bulkCsvText, setBulkCsvText] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("examiner_theme") || localStorage.getItem("theme_mode");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/exams/${examId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setExamTitle(data.title || "Semester Exam");
          setExamStatus(data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : "Draft");
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/questions/libraries`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (data && data.length > 0) {
          setLibraries(data);
        } else {
          setLibraries([
            { id: "1", title: "Computer Science & Programming", purpose: null, question_count: 60 },
            { id: "2", title: "Mathematics & Quantitative Aptitude", purpose: null, question_count: 60 },
          ]);
        }
      })
      .catch(() => {
        setLibraries([
          { id: "1", title: "Computer Science & Programming", purpose: null, question_count: 60 },
          { id: "2", title: "Mathematics & Quantitative Aptitude", purpose: null, question_count: 60 },
        ]);
      });
  }, [examId]);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;

    // Handle AI generation if sourceMode === 'ai'
    if (sourceMode === "ai" && aiPromptTopic.trim()) {
      setAiGenerating(true);
      const token = localStorage.getItem("access_token") || "";
      try {
        await fetch(`${API_BASE}/questions/generate-ai`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: selectedSubject || sectionTitle.trim(),
            topic: aiPromptTopic.trim(),
            count: Number(questionLimit),
            api_key: geminiApiKey.trim() || undefined,
            library_id: selectedLibraryId || undefined,
          }),
        });
      } catch {}
      setAiGenerating(false);
    }

    const newSec: Section = {
      id: String(Date.now()),
      title: sectionTitle.trim(),
      library_id: selectedLibraryId || "1",
      subject: selectedSubject || sectionTitle.trim() || "General",
      section_order: Number(sectionOrder),
      question_limit: Number(questionLimit),
      total_marks: Number(sectionMarks),
      negative_marks: Number(sectionNegativeMarks),
      randomize_questions: randomize,
      creation_mode: sourceMode,
    };

    setSections((prev) => [...prev, newSec]);
    setSectionTitle("");
    setSelectedLibraryId("");
    setSelectedSubject("");
    setAiPromptTopic("");
    setBulkCsvText("");
  };

  const handleDeleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const totalQuestions = sections.reduce((acc, curr) => acc + curr.question_limit, 0);
  const totalMarksSum = sections.reduce((acc, curr) => acc + curr.total_marks, 0);

  return (
    <ExaminerShell title="Exam Builder">
      {/* Top Banner */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem", marginBottom: "1.3rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.35rem" }}>
            <span style={{ padding: "0.15rem 0.55rem", borderRadius: "16px", fontSize: "0.68rem", fontWeight: 600, background: "#854d0e", color: "#fef08a" }}>
              {examStatus}
            </span>
            <span style={{ padding: "0.15rem 0.55rem", borderRadius: "16px", fontSize: "0.68rem", fontWeight: 600, background: "#581c87", color: "#e9d5ff" }}>
              Regular
            </span>
          </div>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: textMain, margin: "0 0 0.2rem 0" }}>
            {examTitle}
          </h2>
          <p style={{ fontSize: "0.78rem", color: textSub, margin: 0 }}>
            Configure subject-wise sections, question library connections, AI generation, and bulk imports.
          </p>
        </div>

        {/* 4 Stat Boxes Top Right */}
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.75rem", minWidth: "65px", textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", color: textSub, fontWeight: 700 }}>SECTIONS</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain }}>{sections.length}</div>
          </div>

          <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.75rem", minWidth: "65px", textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", color: textSub, fontWeight: 700 }}>QUESTIONS</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain }}>{totalQuestions}</div>
          </div>

          <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.75rem", minWidth: "65px", textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", color: textSub, fontWeight: 700 }}>LIMIT</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain }}>{totalQuestions}</div>
          </div>

          <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.5rem 0.75rem", minWidth: "65px", textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", color: textSub, fontWeight: 700 }}>MARKS</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain }}>{totalMarksSum}</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid-2" style={{ gap: "1.2rem" }}>
        {/* Left Panel: Add Section */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.85rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#581c87", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={16} />
            </div>

            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: 0 }}>Add Exam Section</h3>
              <p style={{ fontSize: "0.75rem", color: textSub, margin: "0.1rem 0 0 0" }}>
                Add questions from libraries, bulk import CSV, or generate with Google Gemini AI.
              </p>
            </div>
          </div>

          {/* 3 Question Sourcing Tabs */}
          <div className="grid-3" style={{ gap: "0.4rem", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "0.25rem", marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={() => setSourceMode("library")}
              style={{
                background: sourceMode === "library" ? (isDark ? "#1e293b" : "#ffffff") : "transparent",
                color: sourceMode === "library" ? "#2563eb" : textSub,
                border: "none",
                borderRadius: "6px",
                padding: "0.4rem 0.2rem",
                fontWeight: 700,
                fontSize: "0.72rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
              }}
            >
              <BookOpen size={13} /> Library
            </button>

            <button
              type="button"
              onClick={() => setSourceMode("bulk")}
              style={{
                background: sourceMode === "bulk" ? (isDark ? "#1e293b" : "#ffffff") : "transparent",
                color: sourceMode === "bulk" ? "#2563eb" : textSub,
                border: "none",
                borderRadius: "6px",
                padding: "0.4rem 0.2rem",
                fontWeight: 700,
                fontSize: "0.72rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
              }}
            >
              <Upload size={13} /> Bulk Import
            </button>

            <button
              type="button"
              onClick={() => setSourceMode("ai")}
              style={{
                background: sourceMode === "ai" ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" : "transparent",
                color: sourceMode === "ai" ? "#ffffff" : textSub,
                border: "none",
                borderRadius: "6px",
                padding: "0.4rem 0.2rem",
                fontWeight: 700,
                fontSize: "0.72rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
              }}
            >
              <Sparkles size={13} /> Gemini AI
            </button>
          </div>

          <form onSubmit={handleAddSection} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.3rem" }}>
                Section Title *
              </label>
              <input
                type="text"
                required
                placeholder="Example: Computer Science & Programming"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Mode 1: Sourced from Library */}
            {sourceMode === "library" && (
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.3rem" }}>
                  Select Question Library *
                </label>
                <select
                  value={selectedLibraryId}
                  onChange={(e) => {
                    setSelectedLibraryId(e.target.value);
                    const found = libraries.find((l) => l.id === e.target.value);
                    if (found) setSelectedSubject(found.title.split("&")[0].trim());
                  }}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                >
                  <option value="">Select question library</option>
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.title.replace(/^Evaluated\s+/i, "")} ({lib.question_count} questions)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mode 2: Bulk Import */}
            {sourceMode === "bulk" && (
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.3rem" }}>
                  Paste CSV Questions (or upload file)
                </label>
                <textarea
                  rows={3}
                  placeholder={`Computer Science, mcq, medium, What is CPU?, Option A, Option B, Option C, Option D`}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.78rem", outline: "none", resize: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            {/* Mode 3: Gemini AI Generation */}
            {sourceMode === "ai" && (
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.3rem" }}>
                  AI Topic Prompt *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures, Arrays, and Sorting Algorithms"
                  value={aiPromptTopic}
                  onChange={(e) => setAiPromptTopic(e.target.value)}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div className="form-row" style={{ gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.3rem" }}>
                  Section Order
                </label>
                <input
                  type="number"
                  value={sectionOrder}
                  onChange={(e) => setSectionOrder(Number(e.target.value))}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.3rem" }}>
                  Question Limit
                </label>
                <input
                  type="number"
                  value={questionLimit}
                  onChange={(e) => setQuestionLimit(Number(e.target.value))}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div className="form-row" style={{ gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.3rem" }}>
                  Total Marks
                </label>
                <input
                  type="number"
                  value={sectionMarks}
                  onChange={(e) => setSectionMarks(Number(e.target.value))}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: textMain, marginBottom: "0.3rem" }}>
                  Negative Marks
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={sectionNegativeMarks}
                  onChange={(e) => setSectionNegativeMarks(Number(e.target.value))}
                  style={{ width: "100%", background: innerBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "6px", padding: "0.55rem 0.75rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: textMain }}>Randomize Questions</span>
              <input type="checkbox" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} style={{ width: "15px", height: "15px", cursor: "pointer" }} />
            </div>

            <button
              type="submit"
              disabled={aiGenerating}
              style={{
                background: sourceMode === "ai" ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" : "#9333ea",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.55rem 1rem",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: aiGenerating ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                marginTop: "0.3rem",
              }}
            >
              {sourceMode === "ai" ? <Sparkles size={15} /> : <Plus size={15} />}
              {aiGenerating ? "Generating & Adding Section..." : "Add Section to Exam"}
            </button>
          </form>
        </div>

        {/* Right Panel: Exam Sections List / Empty State */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.3rem", display: "flex", flexDirection: "column", minHeight: "400px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.15rem 0" }}>Exam Sections</h3>
          <p style={{ fontSize: "0.75rem", color: textSub, margin: "0 0 1.2rem 0" }}>
            Students will be able to switch between these subject-wise sections during the exam.
          </p>

          {sections.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px dashed ${cardBorder}`, borderRadius: "12px", padding: "2rem 1.2rem", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#581c87", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.85rem" }}>
                <Layers size={24} />
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: textMain, margin: "0 0 0.3rem 0" }}>
                No sections added yet
              </h4>
              <p style={{ fontSize: "0.78rem", color: textSub, maxWidth: "340px", margin: 0, lineHeight: 1.45 }}>
                Add sections using Question Libraries, Bulk CSV Import, or Google Gemini AI.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {sections.map((sec) => (
                <div key={sec.id} style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.85rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: textMain }}>{sec.title}</div>
                      {sec.creation_mode === "ai" && (
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "12px", background: "#7c3aed", color: "#ffffff" }}>
                          Gemini AI
                        </span>
                      )}
                      {sec.creation_mode === "bulk" && (
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "12px", background: "#2563eb", color: "#ffffff" }}>
                          Bulk CSV
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: textSub, marginTop: "0.1rem" }}>
                      Subject: {sec.subject} &middot; Limit: {sec.question_limit} questions &middot; {sec.total_marks} marks
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSection(sec.id)}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.35rem" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ExaminerShell>
  );
}