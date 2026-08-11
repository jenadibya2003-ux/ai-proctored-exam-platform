"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ExaminerShell from "../ExaminerShell";
import {
  BookOpen,
  Plus,
  Search,
  X,
  Sparkles
} from "lucide-react";

type Library = {
  id: string;
  title: string;
  purpose: string | null;
  question_count: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-proctored-exam-platform-iv1t.onrender.com";

const defaultSubjectLibraries: Library[] = [
  { id: "1", title: "Computer Science & Programming", purpose: "Core programming concepts, syntax, and paradigms", question_count: 60 },
  { id: "2", title: "Mathematics & Quantitative Aptitude", purpose: "Algebra, Calculus, Discrete Math, and Probability", question_count: 60 },
  { id: "3", title: "Physics & Engineering Mechanics", purpose: "Newtonian Physics, Thermodynamics, and Electromagnetism", question_count: 60 },
  { id: "4", title: "Chemistry & Materials Science", purpose: "Organic Chemistry, Physical Chemistry, and Material Properties", question_count: 60 },
  { id: "5", title: "Data Structures & Algorithms", purpose: "Arrays, Trees, Graphs, Sorting, and Dynamic Programming", question_count: 60 },
  { id: "6", title: "Database Management Systems (DBMS)", purpose: "Relational Algebra, SQL, Normalization, and NoSQL", question_count: 60 },
  { id: "7", title: "Operating Systems & Computer Networks", purpose: "Processes, Memory Management, TCP/IP, and Routing", question_count: 60 },
  { id: "8", title: "Web Development & Fullstack Tech", purpose: "HTML, CSS, JavaScript, React, Next.js, and REST APIs", question_count: 60 },
  { id: "9", title: "Software Engineering & DevOps", purpose: "Agile, Testing, CI/CD, Docker, and Architecture", question_count: 60 },
  { id: "10", title: "Artificial Intelligence & Machine Learning", purpose: "Neural Networks, Regression, Classification, and NLP", question_count: 60 }
];

export default function QuestionLibrariesPage() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // New Library Form States
  const [newTitle, setNewTitle] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // AI Generator Form States
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(3);
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiType, setAiType] = useState("mcq");
  const [aiTargetLibrary, setAiTargetLibrary] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState("");

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTargetLibrary) {
      alert("Please select a target Question Library.");
      return;
    }
    setAiGenerating(true);
    setAiSuccessMsg("");

    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(`${API_BASE}/questions/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: aiTopic || "General Subject",
          count: Number(aiCount) || 3,
          difficulty: aiDifficulty,
          question_type: aiType,
          library_id: aiTargetLibrary,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate AI questions");
      }

      const data = await res.json();
      setAiSuccessMsg(data.message || "AI questions generated successfully!");
      setTimeout(() => {
        setShowAIGenerator(false);
        setAiSuccessMsg("");
      }, 1500);

      // Refresh libraries list
      fetch(`${API_BASE}/questions/libraries`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && d.length > 0) setLibraries(d);
        })
        .catch(() => {});
    } catch (err: any) {
      alert(err.message || "Error generating AI questions");
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("examiner_theme");
    setIsDark(savedTheme === "dark");

    const token = localStorage.getItem("access_token") || "";
    fetch(`${API_BASE}/questions/libraries`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.length > 0) {
          setLibraries(data);
        } else {
          setLibraries(defaultSubjectLibraries);
        }
      })
      .catch(() => setLibraries(defaultSubjectLibraries))
      .finally(() => setLoading(false));
  }, []);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const handleCreateLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError("Please enter a library title.");
      return;
    }
    setCreating(true);
    setCreateError("");

    try {
      const token = localStorage.getItem("access_token") || "";
      const res = await fetch(`${API_BASE}/questions/libraries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          purpose: newPurpose.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create library.");
      }

      const created: Library = await res.json();
      setLibraries((prev) => [created, ...prev]);
      setNewTitle("");
      setNewPurpose("");
      setShowCreate(false);
    } catch (err: any) {
      // Create local fallback library if API call fails
      const fallbackLib: Library = {
        id: String(Date.now()),
        title: newTitle.trim(),
        purpose: newPurpose.trim() || "Configured question bank library.",
        question_count: 0,
      };
      setLibraries((prev) => [fallbackLib, ...prev]);
      setNewTitle("");
      setNewPurpose("");
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  const filteredLibraries = libraries.filter((lib) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return lib.title.toLowerCase().includes(q) || (lib.purpose && lib.purpose.toLowerCase().includes(q));
  });

  return (
    <ExaminerShell title="Question Libraries">
      {/* Header & Create Button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.3rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.25rem 0" }}>
            Question Libraries
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            Manage subject-wise question banks and configured question sets.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            onClick={() => {
              const data = [
                {
                  text: "What is the time complexity of searching in a Balanced Binary Search Tree?",
                  question_type: "mcq",
                  marks: 1,
                  options: [
                    { text: "O(1)", is_correct: false },
                    { text: "O(log n)", is_correct: true },
                    { text: "O(n)", is_correct: false },
                    { text: "O(n log n)", is_correct: false }
                  ]
                },
                {
                  text: "Explain the differences between Process and Thread in Operating Systems.",
                  question_type: "long_answer",
                  marks: 5
                }
              ];
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample_question_bank.json";
              a.click();
            }}
            style={{
              background: "transparent",
              border: `1px solid ${cardBorder}`,
              color: textMain,
              padding: "0.55rem 0.9rem",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Download CSV / JSON Template
          </button>

          <button
            onClick={() => setShowAIGenerator(true)}
            style={{
              background: "linear-gradient(135deg, #9333ea 0%, #2563eb 100%)",
              color: "#ffffff",
              border: "none",
              padding: "0.55rem 1rem",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(147, 51, 234, 0.25)",
            }}
          >
            <Sparkles size={16} /> AI Question Generator
          </button>

          <button
            onClick={() => setShowCreate((prev) => !prev)}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "0.55rem 1rem",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Create Library
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "0.75rem 0.9rem", marginBottom: "1.3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Search size={15} style={{ color: textSub }} />
        <input
          type="text"
          placeholder="Search question libraries by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.8rem" }}
        />
      </div>

      {/* Libraries Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {filteredLibraries.map((lib) => (
          <div key={lib.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={18} />
                </div>
                <span style={{ padding: "0.15rem 0.55rem", borderRadius: "16px", fontSize: "0.68rem", fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>
                  {lib.question_count} Questions
                </span>
              </div>

              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 0.35rem 0" }}>
                {lib.title.replace(/^Evaluated\s+/i, "")}
              </h3>

              <p style={{ fontSize: "0.78rem", color: textSub, margin: "0 0 1rem 0", lineHeight: 1.45 }}>
                {lib.purpose || "Configured question bank library for subject examinations."}
              </p>
            </div>

            <Link
              href={`/examiner/questions/${lib.id}`}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "0.5rem 0.9rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
                display: "block",
              }}
            >
              Open Library
            </Link>
          </div>
        ))}
      </div>

      {/* Create Library Modal Dialog */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "18px", padding: "1.8rem", maxWidth: "480px", width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: textMain, margin: 0 }}>
                Create Question Library
              </h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "transparent", border: "none", color: textSub, cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLibrary}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: textMain, marginBottom: "0.4rem" }}>
                  Library Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Computing & Distributed Systems"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: isDark ? "#080d19" : "#ffffff", color: textMain, fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: "1.4rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: textMain, marginBottom: "0.4rem" }}>
                  Purpose / Subject Description
                </label>
                <textarea
                  placeholder="e.g. AWS, GCP, Microservices, and Containerization"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: isDark ? "#080d19" : "#ffffff", color: textMain, fontSize: "0.85rem", outline: "none", resize: "none" }}
                />
              </div>

              {createError && (
                <div style={{ color: "#dc2626", fontSize: "0.78rem", marginBottom: "1rem" }}>
                  {createError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{ padding: "0.55rem 1.1rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: "transparent", color: textMain, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: "0.55rem 1.2rem", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                >
                  {creating ? "Creating..." : "Create Library"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Question Generator Modal */}
      {showAIGenerator && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "1rem" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.6rem", width: "100%", maxWidth: "520px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={20} style={{ color: "#9333ea" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: textMain, margin: 0 }}>
                  AI Question Generator
                </h3>
              </div>
              <button onClick={() => setShowAIGenerator(false)} style={{ background: "transparent", border: "none", color: textSub, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAIGenerate} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>
                  TOPIC / SYLLABUS PROMPT
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCP/IP Three-Way Handshake & Socket Lifecycle"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: isDark ? "#080d19" : "#f8fafc", color: textMain, fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>
                  TARGET QUESTION LIBRARY
                </label>
                <select
                  required
                  value={aiTargetLibrary}
                  onChange={(e) => setAiTargetLibrary(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: isDark ? "#080d19" : "#f8fafc", color: textMain, fontSize: "0.85rem", outline: "none" }}
                >
                  <option value="">-- Select Target Question Library --</option>
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.title} ({lib.question_count} questions)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>
                    COUNT
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: isDark ? "#080d19" : "#f8fafc", color: textMain, fontSize: "0.85rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>
                    DIFFICULTY
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: isDark ? "#080d19" : "#f8fafc", color: textMain, fontSize: "0.85rem", outline: "none" }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>
                    TYPE
                  </label>
                  <select
                    value={aiType}
                    onChange={(e) => setAiType(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: isDark ? "#080d19" : "#f8fafc", color: textMain, fontSize: "0.85rem", outline: "none" }}
                  >
                    <option value="mcq">MCQ</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
              </div>

              {aiSuccessMsg && (
                <div style={{ color: "#22c55e", fontSize: "0.8rem", fontWeight: 700, textAlign: "center", background: "#f0fdf4", padding: "0.4rem", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                  ✓ {aiSuccessMsg}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAIGenerator(false)}
                  style={{ padding: "0.55rem 1.1rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: "transparent", color: textMain, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aiGenerating}
                  style={{
                    padding: "0.55rem 1.3rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #9333ea 0%, #2563eb 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  {aiGenerating ? "Generating..." : "Generate Questions with AI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ExaminerShell>
  );
}
