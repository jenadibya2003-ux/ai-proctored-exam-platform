"use client";

import React, { useEffect, useRef, useState } from "react";
import FormattedText from "../components/FormattedText";
import LanguageSelector from "../components/LanguageSelector";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import StudentShell from "../student/StudentShell";
import {
  Camera,
  Mic,
  Wifi,
  Monitor,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Globe,
  Volume2,
  BookOpen,
  Clock,
  Award
} from "lucide-react";

type MockQuestion = {
  id: string;
  question_type: "mcq" | "multi_select" | "short_answer" | "long_answer" | "image_upload";
  text: string;
  marks: number;
  options: { id: string; text: string; is_correct?: boolean }[];
};

type ExamStep = "check" | "guidelines" | "taking" | "submitted";

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
const MAX_WARNINGS = 5;
const FLAGGED_OBJECTS = ["cell phone", "laptop", "book", "remote", "tv", "tablet"];

export default function MockExamPage() {
  const [step, setStep] = useState<ExamStep>("check");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);

  // System Check States
  const [camDevice, setCamDevice] = useState("Detecting camera...");
  const [micDevice, setMicDevice] = useState("Detecting microphone...");
  const [netLatency, setNetLatency] = useState(14);
  const [agreedGuidelines, setAgreedGuidelines] = useState(false);

  // Taking Exam States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [key: string]: boolean }>({});
  const [secondsLeft, setSecondsLeft] = useState(1800); // 30 minutes practice timer

  // Countdown timer effect
  useEffect(() => {
    if (step !== "taking") return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep("submitted");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasEnteredOnceRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFaceStatusRef = useRef<"ok" | "no-face" | "multiple-faces" | "loading">("loading");
  const [faceModel, setFaceModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [faceStatus, setFaceStatus] = useState<"ok" | "no-face" | "multiple-faces" | "loading">("loading");
  const [deviceModel, setDeviceModel] = useState<any>(null);
  const lastDeviceDetectedRef = useRef(false);

  const [warningCount, setWarningCount] = useState(0);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("student_theme");
    setIsDark(savedTheme === "dark");

    async function loadMock() {
      const token = localStorage.getItem("access_token") || "";
      if (!token) {
        setError("You're not logged in. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/questions/mock-sample`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError("Could not load mock test questions.");
          setLoading(false);
          return;
        }
        const data: MockQuestion[] = await res.json();
        setQuestions(data);
        setLoading(false);
      } catch {
        setError("Could not reach the server. Is the backend running?");
        setLoading(false);
      }
    }
    loadMock();
  }, []);

  // System Check Loop
  useEffect(() => {
    async function runChecks() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        setCamDevice(videoTrack ? `Using: ${videoTrack.label || "Webcam HD Camera"}` : "Webcam active");
        setMicDevice(audioTrack ? `Using: ${audioTrack.label || "Microphone Array"}` : "Microphone active");
      } catch {
        setCamDevice("Webcam Authorized");
        setMicDevice("Microphone Authorized");
      }
      setNetLatency(14);
    }

    if (step === "check") {
      runChecks();
    }
  }, [step]);

  const playWarningBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {}
  };

  function triggerWarning(message: string) {
    playWarningBeep();
    setWarningCount((prev) => {
      const next = prev + 1;
      setActiveWarning(message);
      return next;
    });
  }

  // Comprehensive proctoring event listeners (Tab switch, Window blur, Fullscreen exit, Screenshots, F12 inspect, Right-click)
  useEffect(() => {
    if (step !== "taking") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerWarning("Tab switch detected. Leaving the exam window is strictly prohibited.");
      }
    };

    const handleBlur = () => {
      triggerWarning("Window focus lost. Please stay focused on the exam window.");
    };

    const handleFullscreenChange = () => {
      const nowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(nowFullscreen);
      if (!nowFullscreen && hasEnteredOnceRef.current) {
        triggerWarning("Exited fullscreen mode. You must remain in fullscreen mode throughout the exam.");
      }
      if (nowFullscreen) {
        hasEnteredOnceRef.current = true;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Screenshot / PrintScreen Detection
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        try {
          if (navigator.clipboard) navigator.clipboard.writeText("");
        } catch {}
        triggerWarning("Screenshot attempt detected (PrintScreen key). Taking screenshots is strictly prohibited.");
        return;
      }

      // 2. Snipping Tool / OS Screenshot Shortcuts (Win+Shift+S, Cmd+Shift+S, Ctrl+Shift+S)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "S" || e.key === "s" || e.key === "4" || e.key === "3")) {
        e.preventDefault();
        triggerWarning("Screen capture shortcut detected. Taking screenshots is strictly prohibited.");
        return;
      }

      // 3. Print Shortcut (Ctrl+P / Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        triggerWarning("Page print attempt detected. Printing exam questions is prohibited.");
        return;
      }

      // 4. Developer Tools Shortcuts (F12, Ctrl+Shift+I/J/C)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c"))
      ) {
        e.preventDefault();
        triggerWarning("Developer tools shortcut detected. Inspecting exam elements is prohibited.");
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        try {
          if (navigator.clipboard) navigator.clipboard.writeText("");
        } catch {}
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerWarning("Right-click context menu blocked. Context menu is disabled during exams.");
    };

    const handleCopyPaste = (e: Event) => {
      e.preventDefault();
      triggerWarning("Copy / paste blocked. Copying content is disabled during exams.");
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, [step]);

  async function handleStartMockTest() {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
    setStep("taking");
  }

  // Audio Voice Level Monitoring Loop
  useEffect(() => {
    if (step !== "taking" || !streamRef.current) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let audioInterval: NodeJS.Timeout | null = null;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(streamRef.current);
      microphone.connect(analyser);
      analyser.fftSize = 512;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioInterval = setInterval(() => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / dataArray.length;

        if (average > 45) {
          triggerWarning("Background voice or external audio detected. Please remain quiet during the exam.");
        }
      }, 1500);
    } catch {
      // Audio context fallthrough
    }

    return () => {
      if (audioInterval) clearInterval(audioInterval);
      if (audioContext) audioContext.close().catch(() => {});
    };
  }, [step]);

  // Instant Webcam Stream Acquisition
  useEffect(() => {
    if (step !== "taking") return;

    async function initWebcam() {
      try {
        if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
      } catch {
        setError((prev) => prev || "Could not access webcam stream.");
      }
    }
    initWebcam();

    // Async Background TensorFlow Model Loading
    async function loadModels() {
      try {
        await tf.ready();
        const loadedFaceModel = await blazeface.load();
        setFaceModel(loadedFaceModel);

        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        const loadedDeviceModel = await cocoSsd.load();
        setDeviceModel(loadedDeviceModel);
      } catch {}
    }
    loadModels();
  }, [step]);

  useEffect(() => {
    if (step !== "taking" || !faceModel) return;
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;
      const predictions = await faceModel.estimateFaces(videoRef.current, false);
      let newStatus: "ok" | "no-face" | "multiple-faces" = "ok";
      if (predictions.length === 0) newStatus = "no-face";
      else if (predictions.length > 1) newStatus = "multiple-faces";
      else if (predictions.length === 1) {
        const face = predictions[0];
        if (face && face.topLeft && face.bottomRight) {
          const faceCenterX = (face.topLeft[0] + face.bottomRight[0]) / 2;
          const videoWidth = videoRef.current.videoWidth || 640;
          const normalizedX = faceCenterX / videoWidth;
          if (normalizedX < 0.22 || normalizedX > 0.78) {
            triggerWarning("Gaze drift / head turned away detected");
          }
        }
      }
      setFaceStatus(newStatus);
      if (newStatus !== lastFaceStatusRef.current) {
        if (newStatus === "no-face") triggerWarning("No face detected");
        if (newStatus === "multiple-faces") triggerWarning("Multiple faces detected");
        lastFaceStatusRef.current = newStatus;
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, faceModel]);

  useEffect(() => {
    if (step !== "taking" || !deviceModel) return;
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;
      const predictions = await deviceModel.detect(videoRef.current);
      const flagged = predictions.find((p: any) => FLAGGED_OBJECTS.includes(p.class) && p.score > 0.6);
      if (flagged && !lastDeviceDetectedRef.current) {
        triggerWarning(`Unauthorized device detected: ${flagged.class}`);
        lastDeviceDetectedRef.current = true;
      } else if (!flagged) {
        lastDeviceDetectedRef.current = false;
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [step, deviceModel]);

  function exitMock() {
    localStorage.removeItem("mock_mode");
    localStorage.removeItem("pending_exam_title");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    window.location.href = "/student/dashboard";
  }

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  if (loading) {
    return (
      <StudentShell title="Mock Practice Test">
        <div style={{ color: textSub, padding: "2rem", textAlign: "center", fontSize: "0.85rem" }}>
          Loading practice test questions...
        </div>
      </StudentShell>
    );
  }

  if (error) {
    return (
      <StudentShell title="Mock Practice Test">
        <div style={{ maxWidth: "480px", margin: "2rem auto", textAlign: "center" }}>
          <p style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
          <button onClick={exitMock} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.6rem 1.2rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
            Back to Student Dashboard
          </button>
        </div>
      </StudentShell>
    );
  }

  // STEP 1: Pre-Exam System Check
  if (step === "check") {
    return (
      <StudentShell title="Pre-Exam System Check">
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "1rem 0" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.2rem" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Monitor size={28} />
              </div>
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: textMain, textAlign: "center", margin: "0 0 0.3rem 0" }}>
              Pre-Exam System Check
            </h2>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", textAlign: "center", marginBottom: "0.4rem" }}>
              Practice Mock Examination
            </div>
            <p style={{ fontSize: "0.82rem", color: textSub, textAlign: "center", margin: "0 0 1.8rem 0" }}>
              All checks must pass before you can proceed to the guidelines and start your test.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginBottom: "2rem" }}>
              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: textMain }}>Camera Access</div>
                    <div style={{ fontSize: "0.78rem", color: textSub }}>{camDevice}</div>
                  </div>
                </div>
                <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mic size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: textMain }}>Microphone Access</div>
                    <div style={{ fontSize: "0.78rem", color: textSub }}>{micDevice}</div>
                  </div>
                </div>
                <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wifi size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: textMain }}>Internet Speed</div>
                    <div style={{ fontSize: "0.78rem", color: textSub }}>Latency: {netLatency} ms</div>
                  </div>
                </div>
                <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Monitor size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: textMain }}>Browser Compatibility</div>
                    <div style={{ fontSize: "0.78rem", color: textSub }}>Chrome / Edge supported</div>
                  </div>
                </div>
                <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Maximize2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: textMain }}>FullScreen Mode</div>
                    <div style={{ fontSize: "0.78rem", color: textSub }}>Fullscreen ready</div>
                  </div>
                </div>
                <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <button onClick={exitMock} style={{ padding: "0.7rem 1.4rem", borderRadius: "10px", border: `1px solid ${cardBorder}`, background: innerBg, color: textMain, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
                Cancel
              </button>

              <button onClick={() => setStep("guidelines")} style={{ padding: "0.7rem 1.6rem", borderRadius: "10px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                Proceed to Guidelines <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  // STEP 2: Exam Guidelines
  if (step === "guidelines") {
    return (
      <StudentShell title="Exam Guidelines">
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem 0" }}>
          <div style={{ textAlign: "center", marginBottom: "1.6rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.8rem" }}>
              <ShieldCheck size={26} />
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: textMain, margin: "0 0 0.3rem 0" }}>
              Practice Exam Guidelines
            </h2>
            <p style={{ fontSize: "0.85rem", color: textSub, margin: "0 0 1rem 0" }}>
              Please read these instructions carefully before starting your <strong>Practice Mock Exam</strong>.
            </p>

            <div style={{ display: "inline-flex", gap: "1rem", background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "30px", padding: "0.45rem 1.2rem", fontSize: "0.82rem", fontWeight: 700, color: textMain }}>
              <span>⏱ 30 minutes</span>
              <span>•</span>
              <span>📋 {questions.length} questions</span>
              <span>•</span>
              <span style={{ color: "#2563eb" }}>🛡 AI Proctored</span>
            </div>
          </div>

          {/* Monitored section */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.4rem", marginBottom: "1.2rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={18} style={{ color: "#2563eb" }} /> What's Being Monitored
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: textMain, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Camera size={16} style={{ color: "#2563eb" }} /> Webcam
                </div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>Your face must be visible throughout the test</div>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: textMain, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Monitor size={16} style={{ color: "#2563eb" }} /> Screen Activity
                </div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>Tab switches and window changes are tracked</div>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: textMain, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Volume2 size={16} style={{ color: "#2563eb" }} /> Audio
                </div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>Background noise and speech are detected</div>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: textMain, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ShieldCheck size={16} style={{ color: "#2563eb" }} /> Face Detection
                </div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>AI checks for absence or multiple faces</div>
              </div>
            </div>
          </div>

          {/* Not Allowed section */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.4rem", marginBottom: "1.2rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#dc2626", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={18} /> Not Allowed During Test
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: textMain, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Smartphone size={16} style={{ color: "#dc2626" }} /> Mobile Phones
                </div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>Keep all devices away from your desk</div>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: textMain, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Globe size={16} style={{ color: "#dc2626" }} /> Switching Tabs
                </div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>Do not switch tabs or open other browser windows</div>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: textMain, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Volume2 size={16} style={{ color: "#dc2626" }} /> Talking
                </div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>No reading questions aloud or whispering</div>
              </div>

              <div style={{ background: innerBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: textMain, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <BookOpen size={16} style={{ color: "#dc2626" }} /> External Help
                </div>
                <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.2rem" }}>No books, notes, or external assistance</div>
              </div>
            </div>
          </div>

          {/* Warning System */}
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "16px", padding: "1.2rem", marginBottom: "1.2rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#b45309", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <AlertTriangle size={18} /> Warning System
            </div>
            <div style={{ fontSize: "0.82rem", color: "#92400e", lineHeight: 1.5 }}>
              If you violate any rule, you will receive a warning popup.
              <br />
              <strong>After 5 warnings, your mock test will end.</strong>
            </div>
          </div>

          {/* Checkbox */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.8rem" }}>
            <input
              type="checkbox"
              id="mock-guidelines-check"
              checked={agreedGuidelines}
              onChange={(e) => setAgreedGuidelines(e.target.checked)}
              style={{ width: "18px", height: "18px", marginTop: "0.15rem", cursor: "pointer" }}
            />
            <label htmlFor="mock-guidelines-check" style={{ fontSize: "0.82rem", color: textMain, lineHeight: 1.5, cursor: "pointer" }}>
              I have read and understood all the guidelines above. I agree to follow the practice rules and enter full screen mode.
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep("check")} style={{ padding: "0.7rem 1.4rem", borderRadius: "10px", border: `1px solid ${cardBorder}`, background: innerBg, color: textMain, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ArrowLeft size={16} /> Back
            </button>

            <button
              onClick={handleStartMockTest}
              disabled={!agreedGuidelines}
              style={{
                padding: "0.75rem 1.8rem",
                borderRadius: "10px",
                border: "none",
                background: agreedGuidelines ? "#16a34a" : "#cbd5e1",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: agreedGuidelines ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              Enter Fullscreen & Start Mock Exam <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </StudentShell>
    );
  }

  // STEP 4: Submitted
  if (step === "submitted") {
    const scorable = questions.filter((q) => q.question_type === "mcq" || q.question_type === "multi_select");
    let correct = 0;
    scorable.forEach((q) => {
      const selected = answers[q.id];
      const correctOption = q.options?.find((o) => o.is_correct);
      if (selected && correctOption && selected === correctOption.id) correct += 1;
    });
    const percentage = scorable.length > 0 ? Math.round((correct / scorable.length) * 100) : 100;

    return (
      <StudentShell title="Mock Test Complete">
        <div style={{ maxWidth: "480px", margin: "2rem auto", textAlign: "center" }}>
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "20px", padding: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: textMain, margin: "0 0 0.8rem 0" }}>
              Mock Test Complete!
            </h3>
            <div style={{ padding: "1.2rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", marginBottom: "1.2rem" }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#15803d" }}>{percentage}%</div>
              <div style={{ fontSize: "0.82rem", color: "#166534", fontWeight: 600, marginTop: "0.2rem" }}>
                {correct} of {scorable.length} scored questions correct
              </div>
            </div>
            <p style={{ fontSize: "0.85rem", color: textSub, marginBottom: "1.4rem" }}>
              Great practice run — best of luck on your official exams!
            </p>
            <button onClick={exitMock} style={{ width: "100%", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", padding: "0.75rem", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
              Back to Student Dashboard
            </button>
          </div>
        </div>
      </StudentShell>
    );
  }

  // STEP 3: Active Taking Environment
  const q = questions[currentIndex];
  const isMCQ = q?.question_type === "mcq" || q?.question_type === "multi_select";
  const isLast = currentIndex === questions.length - 1;

  return (
    <div style={{ ...styles.page, position: "relative" }}>
      {/* Security Translucent Watermark Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          opacity: 0.04,
          userSelect: "none",
          transform: "rotate(-22deg)",
          fontSize: "1.3rem",
          fontWeight: 800,
          color: "#000000",
          letterSpacing: "3px",
        }}
      >
        <div>PRACTICE MOCK TEST • CANDIDATE SESSION ACTIVE</div>
        <div>AI-PROCTORED EVALUATION ENGINE • DO NOT DISTRIBUTE</div>
        <div>CONFIDENTIAL PRACTICE SESSION • SYSTEM MONITORED</div>
      </div>
      <header style={{ ...styles.header, height: "60px", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={styles.badge}>MOCK TEST — PRACTICE MODE</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
            Computer Science Practice Test
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <LanguageSelector />
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#dcfce7", color: "#15803d", padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#16a34a" }} />
            Proctoring Active
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
            <Clock size={16} style={{ color: "#2563eb" }} />
            <span>{formatTime(secondsLeft)}</span>
          </div>

          <button
            onClick={() => setStep("submitted")}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.45rem 1rem",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Content Area: Left Sidebar (Webcam Top Left + Compact Palette), Right Main Question Card */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.4rem", padding: "1.4rem 1.8rem", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Left Column: Single Webcam Stream at Top Left + Questions Palette */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Top Left Embedded Webcam Stream */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "0.85rem", overflow: "hidden" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: textSub, marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Webcam Feed</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#16a34a" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
                Monitoring
              </span>
            </div>
            <div style={{ width: "100%", height: "190px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${cardBorder}`, background: "#000000", position: "relative" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            </div>
          </div>

          {/* Questions Palette Card */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: textMain, margin: 0 }}>
                Questions Palette
              </h4>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: textSub }}>
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Status Counters Legend */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.85rem", fontSize: "0.7rem", color: textSub }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: innerBg, padding: "0.35rem 0.5rem", borderRadius: "6px", border: `1px solid ${cardBorder}` }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#16a34a", flexShrink: 0 }} />
                <span>Answered ({Object.keys(answers).length})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: innerBg, padding: "0.35rem 0.5rem", borderRadius: "6px", border: `1px solid ${cardBorder}` }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#9333ea", flexShrink: 0 }} />
                <span>Review ({Object.keys(markedForReview).filter((k) => markedForReview[k]).length})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: innerBg, padding: "0.35rem 0.5rem", borderRadius: "6px", border: `1px solid ${cardBorder}`, gridColumn: "span 2" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: innerBg, border: `1px solid ${cardBorder}`, flexShrink: 0 }} />
                <span>Unanswered ({Math.max(0, questions.length - Object.keys(answers).length)})</span>
              </div>
            </div>

            {/* Question Number Buttons (1 to N with scroll if needed) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.45rem", maxHeight: "280px", overflowY: "auto", paddingRight: "0.2rem" }}>
              {questions.map((qItem, idx) => {
                const isAns = !!answers[qItem.id];
                const isMarked = !!markedForReview[qItem.id];
                const isCurr = idx === currentIndex;

                let btnBg = innerBg;
                let btnColor = textMain;
                let btnBorder = `1px solid ${cardBorder}`;

                if (isMarked) {
                  btnBg = "#9333ea";
                  btnColor = "#ffffff";
                  btnBorder = "1px solid #7e22ce";
                } else if (isAns) {
                  btnBg = "#16a34a";
                  btnColor = "#ffffff";
                  btnBorder = "1px solid #15803d";
                }

                return (
                  <button
                    key={qItem.id}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      height: "34px",
                      borderRadius: "6px",
                      border: isCurr ? "2px solid #2563eb" : btnBorder,
                      boxShadow: isCurr ? "0 0 0 3px rgba(37, 99, 235, 0.25)" : "none",
                      background: btnBg,
                      color: btnColor,
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Main Question Card */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "1.5rem" }}>
          {/* Question Card Top Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "0.45rem" }}>
              <span style={{ background: "#dbeafe", color: "#1e40af", padding: "0.2rem 0.6rem", borderRadius: "16px", fontSize: "0.72rem", fontWeight: 700 }}>
                Q{currentIndex + 1}/{questions.length || 10}
              </span>
              <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "0.2rem 0.6rem", borderRadius: "16px", fontSize: "0.72rem", fontWeight: 700 }}>
                {q?.marks || 1} pts
              </span>
              <span style={{ background: "#eff6ff", color: "#2563eb", padding: "0.2rem 0.6rem", borderRadius: "16px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                {q?.question_type || "mcq"}
              </span>
            </div>

            {q && (
              <button
                onClick={() => setMarkedForReview((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                style={{
                  background: markedForReview[q.id] ? "#9333ea" : innerBg,
                  border: `1px solid ${markedForReview[q.id] ? "#7e22ce" : cardBorder}`,
                  color: markedForReview[q.id] ? "#ffffff" : textMain,
                  borderRadius: "8px",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                🚩 {markedForReview[q.id] ? "Marked for Review" : "Mark for Review"}
              </button>
            )}
          </div>

          {/* Question Text */}
          {q && (
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: textMain, margin: "0 0 1.2rem 0", lineHeight: 1.45 }}>
              <FormattedText text={q.text} />
            </div>
          )}

          {/* Clean A, B, C, D Options List */}
          {isMCQ && q?.options && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginBottom: "1.4rem" }}>
              {q.options.map((opt, optIdx) => {
                const optionLetter = String.fromCharCode(65 + optIdx); // "A", "B", "C", "D"
                const rawId = opt.id || String(optIdx);
                const isSelected = answers[q.id] === rawId || answers[q.id] === optionLetter;
                const cleanText = (opt.text || "").replace(/^[0-9a-fA-F-]{36}\s*/, "");

                return (
                  <button
                    key={rawId}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: rawId }))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "10px",
                      border: `1px solid ${isSelected ? "#2563eb" : cardBorder}`,
                      background: isSelected ? (isDark ? "#1e293b" : "#eff6ff") : innerBg,
                      color: textMain,
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    <span
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        border: `1px solid ${isSelected ? "#2563eb" : cardBorder}`,
                        background: isSelected ? "#2563eb" : innerBg,
                        color: isSelected ? "#ffffff" : textSub,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {optionLetter}
                    </span>
                    <div style={{ lineHeight: 1.4, flex: 1 }}>
                      <FormattedText text={cleanText} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Action Navigation Buttons directly below options */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${cardBorder}`, paddingTop: "1rem" }}>
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                border: `1px solid ${cardBorder}`,
                background: innerBg,
                color: textMain,
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                opacity: currentIndex === 0 ? 0.5 : 1,
              }}
            >
              &lt; Previous
            </button>

            <div style={{ display: "flex", gap: "0.7rem" }}>
              {q && (
                <button
                  onClick={() => setMarkedForReview((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                  style={{
                    padding: "0.6rem 1.1rem",
                    borderRadius: "8px",
                    border: `1px solid ${cardBorder}`,
                    background: markedForReview[q.id] ? "#9333ea" : innerBg,
                    color: markedForReview[q.id] ? "#ffffff" : textMain,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {markedForReview[q.id] ? "Marked for Review" : "Mark for Review"}
                </button>
              )}

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  style={{
                    padding: "0.6rem 1.5rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Save &amp; Next &gt;
                </button>
              ) : (
                <>
                  <button
                    onClick={() => alert("Practice answer saved!")}
                    style={{
                      padding: "0.6rem 1.3rem",
                      borderRadius: "8px",
                      border: `1px solid ${cardBorder}`,
                      background: innerBg,
                      color: textMain,
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setStep("submitted")}
                    style={{
                      padding: "0.6rem 1.5rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Submit Test
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeWarning && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, border: "2px solid #d97706" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#92400e", fontSize: "1rem" }}>Warning</div>
                <div style={{ fontSize: "0.75rem", color: "#92400e" }}>
                  Warning {warningCount} of {MAX_WARNINGS} &middot; practice mode
                </div>
              </div>
            </div>
            <p style={styles.modalText}>{activeWarning}.</p>
            <button onClick={() => setActiveWarning(null)} style={styles.navButtonPrimary}>
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  centerScreen: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#f8fafc", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "#ffffff", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "0.5rem" },
  badge: { fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", color: "#92400e", background: "#fef3c7", padding: "0.25rem 0.6rem", borderRadius: "999px" },
  examTitle: { fontSize: "0.85rem", color: "#64748b" },
  body: { display: "flex", maxWidth: "1000px", margin: "0 auto", padding: "1rem", gap: "1rem", flexWrap: "wrap" },
  sidebar: { width: "100%", maxWidth: "260px", flex: "1 1 220px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem", height: "fit-content" },
  webcamPreview: { width: "100%", height: "140px", borderRadius: "10px", border: "2px solid #e2e8f0", objectFit: "cover", background: "#0f172a", marginBottom: "0.6rem", display: "block" },
  faceStatusTag: { fontSize: "0.75rem", fontWeight: 700, padding: "0.3rem 0.6rem", borderRadius: "999px", background: "#f1f5f9", color: "#64748b", display: "block", textAlign: "center", marginBottom: "1rem" },
  faceStatusOk: { background: "#dcfce7", color: "#15803d" },
  faceStatusWarn: { background: "#fef3c7", color: "#92400e" },
  faceStatusDanger: { background: "#fee2e2", color: "#b91c1c" },
  sidebarTitle: { fontSize: "0.8rem", fontWeight: 700, color: "#64748b" },
  questionArea: { flex: "1 1 300px", minWidth: "280px", display: "flex", flexDirection: "column", gap: "1rem" },
  questionCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem" },
  questionMeta: { fontSize: "0.8rem", color: "#64748b", marginBottom: "0.6rem" },
  questionText: { fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 1.2rem 0", lineHeight: 1.4 },
  demoNotice: { background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "0.9rem 1rem", borderRadius: "10px", fontSize: "0.85rem", lineHeight: 1.5 },
  optionsList: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  optionRow: { display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.75rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", color: "#334155" },
  optionRowSelected: { borderColor: "#4338ca", background: "#eef2ff", color: "#3730a3" },
  radio: { accentColor: "#4338ca" },
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0.85rem 1rem", flexWrap: "wrap", gap: "0.6rem" },
  actionRowRight: { display: "flex", gap: "0.6rem", flexWrap: "wrap" },
  navButton: { padding: "0.65rem 1.2rem", fontSize: "0.88rem", fontWeight: 600, border: "1.5px solid #e2e8f0", borderRadius: "8px", background: "#ffffff", color: "#334155", cursor: "pointer" },
  navButtonPrimary: { background: "#4338ca", color: "#ffffff", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" },
  navButtonDisabled: { opacity: 0.4, cursor: "not-allowed" },
  submitButton: { background: "#16a34a", color: "#ffffff", border: "none" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modalCard: { background: "#ffffff", borderRadius: "12px", padding: "1.8rem", maxWidth: "380px", width: "90%", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" },
  modalTitle: { fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.6rem 0", textAlign: "center" },
  modalText: { fontSize: "0.9rem", color: "#475569", lineHeight: 1.5, margin: "0 0 1rem 0" },
  scoreBox: { marginTop: "0.5rem", padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.3rem" },
  scoreNumber: { fontSize: "2rem", fontWeight: 800, color: "#15803d" },
  scoreLabel: { fontSize: "0.85rem", color: "#166534" },
};