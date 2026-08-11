"use client";

import { useEffect, useState } from "react";
import AdminShell from "../AdminShell";
import {
  Bell,
  Trash2,
  CheckCheck,
  Megaphone,
  Calendar,
  User,
  ShieldAlert,
  BookOpen,
  RefreshCw,
} from "lucide-react";

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

type Notification = {
  id: string;
  title: string;
  message: string;
  category: string;
  target_role: string;
  is_read: boolean;
  created_at: string;
};

function getCategoryIcon(category: string) {
  switch (category) {
    case "exam_scheduled": return <Calendar size={16} />;
    case "exam_submitted": return <BookOpen size={16} />;
    case "user_login": return <User size={16} />;
    case "proctoring": return <ShieldAlert size={16} />;
    case "announcement": return <Megaphone size={16} />;
    default: return <Bell size={16} />;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "exam_scheduled": return { bg: "#eff6ff", color: "#2563eb" };
    case "exam_submitted": return { bg: "#dcfce7", color: "#16a34a" };
    case "user_login": return { bg: "#f3e8ff", color: "#9333ea" };
    case "proctoring": return { bg: "#fee2e2", color: "#dc2626" };
    case "announcement": return { bg: "#fef9c3", color: "#b45309" };
    default: return { bg: "#f1f5f9", color: "#64748b" };
  }
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showBroadcast, setShowBroadcast] = useState(false);

  const [bTitle, setBTitle] = useState("");
  const [bMessage, setBMessage] = useState("");
  const [bRole, setBRole] = useState("all");
  const [bCategory, setBCategory] = useState("announcement");
  const [bSending, setBSending] = useState(false);
  const [bSuccess, setBSuccess] = useState("");

  const getToken = () => localStorage.getItem("access_token") || "";

  const fetchNotifications = () => {
    setLoading(true);
    fetch(`${API_BASE}/notifications/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("admin_theme");
    setIsDark(savedTheme === "dark");
    fetchNotifications();
  }, []);

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {});
  };

  const handleMarkAllRead = () => {
    notifications.filter((n) => !n.is_read).forEach((n) => handleMarkRead(n.id));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    fetch(`${API_BASE}/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {});
  };

  const handleDeleteAll = () => {
    if (!confirm("Delete all notifications? This cannot be undone.")) return;
    notifications.forEach((n) => {
      fetch(`${API_BASE}/notifications/${n.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      }).catch(() => {});
    });
    setNotifications([]);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim() || !bMessage.trim()) return;
    setBSending(true);
    setBSuccess("");
    fetch(`${API_BASE}/notifications/admin/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title: bTitle, message: bMessage, target_role: bRole, category: bCategory }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setBSuccess("Notification broadcast successfully!");
          setBTitle("");
          setBMessage("");
          fetchNotifications();
        }
      })
      .catch(() => {})
      .finally(() => setBSending(false));
  };

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const innerBg = isDark ? "#080d19" : "#f8fafc";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";

  const filtered = filter === "all" ? notifications
    : filter === "unread" ? notifications.filter((n) => !n.is_read)
    : notifications.filter((n) => n.category === filter);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AdminShell title="Notifications">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.4rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: textMain, margin: "0 0 0.2rem 0" }}>
            Notifications Center
          </h2>
          <p style={{ fontSize: "0.8rem", color: textSub, margin: 0 }}>
            {unreadCount} unread &middot; {notifications.length} total
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button onClick={fetchNotifications} style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "8px", padding: "0.5rem 0.9rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleMarkAllRead} style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: "#16a34a", borderRadius: "8px", padding: "0.5rem 0.9rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <CheckCheck size={14} /> Mark All Read
          </button>
          <button onClick={handleDeleteAll} style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "8px", padding: "0.5rem 0.9rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Trash2 size={14} /> Clear All
          </button>
          <button onClick={() => setShowBroadcast(!showBroadcast)} style={{ background: "#2563eb", border: "none", color: "#ffffff", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Megaphone size={14} /> Broadcast Announcement
          </button>
        </div>
      </div>

      {/* Broadcast Panel */}
      {showBroadcast && (
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "1.4rem", marginBottom: "1.4rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: textMain, margin: "0 0 1rem 0" }}>Create & Broadcast New Notification</h3>
          {bSuccess && (
            <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.82rem", color: "#15803d", marginBottom: "0.8rem", fontWeight: 600 }}>
              {bSuccess}
            </div>
          )}
          <form onSubmit={handleBroadcast} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>NOTIFICATION TITLE</label>
              <input required placeholder="e.g. Midterm exam rescheduled to Dec 10" value={bTitle} onChange={(e) => setBTitle(e.target.value)}
                style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: innerBg, color: textMain, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>CATEGORY</label>
              <select value={bCategory} onChange={(e) => setBCategory(e.target.value)}
                style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: innerBg, color: textMain, fontSize: "0.85rem", outline: "none" }}>
                <option value="announcement">General Announcement</option>
                <option value="exam_scheduled">Exam Scheduled</option>
                <option value="exam_submitted">Exam Result / Submission</option>
                <option value="proctoring">Proctoring Alert</option>
                <option value="user_login">User Activity</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>TARGET AUDIENCE</label>
              <select value={bRole} onChange={(e) => setBRole(e.target.value)}
                style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: innerBg, color: textMain, fontSize: "0.85rem", outline: "none" }}>
                <option value="all">All Users (Students & Examiners)</option>
                <option value="student">Students Only</option>
                <option value="examiner">Examiners Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: textSub, marginBottom: "0.3rem" }}>MESSAGE BODY</label>
              <textarea required rows={3} placeholder="Enter the full notification message..." value={bMessage} onChange={(e) => setBMessage(e.target.value)}
                style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: `1px solid ${cardBorder}`, background: innerBg, color: textMain, fontSize: "0.85rem", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={bSending}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.6rem 1.4rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                {bSending ? "Broadcasting..." : "Broadcast Now"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
        {["all", "unread", "announcement", "exam_scheduled", "exam_submitted", "proctoring", "user_login"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? "#2563eb" : cardBg, color: filter === f ? "#ffffff" : textSub, border: `1px solid ${filter === f ? "#2563eb" : cardBorder}`, borderRadius: "20px", padding: "0.3rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
            {f === "all" ? `All (${notifications.length})` : f === "unread" ? `Unread (${unreadCount})` : f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: "center", color: textSub, padding: "3rem", fontSize: "0.9rem" }}>Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: textSub }}>No notifications found</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {filtered.map((n) => {
            const catStyle = getCategoryColor(n.category);
            return (
              <div key={n.id} style={{ background: n.is_read ? cardBg : (isDark ? "#0f1e38" : "#eff6ff"), border: `1px solid ${n.is_read ? cardBorder : "#93c5fd"}`, borderRadius: "12px", padding: "1rem 1.2rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: catStyle.bg, color: catStyle.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {getCategoryIcon(n.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: textMain }}>{n.title}</span>
                    {!n.is_read && <span style={{ background: "#2563eb", color: "#fff", fontSize: "0.6rem", fontWeight: 800, borderRadius: "10px", padding: "0.1rem 0.4rem" }}>NEW</span>}
                    <span style={{ background: catStyle.bg, color: catStyle.color, fontSize: "0.65rem", fontWeight: 700, borderRadius: "8px", padding: "0.1rem 0.45rem", textTransform: "capitalize" }}>
                      {n.category?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: textSub, lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.35rem", fontSize: "0.7rem", color: textSub }}>
                    <span>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</span>
                    <span>Target: <strong style={{ color: textMain }}>{n.target_role || "all"}</strong></span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} style={{ background: "#dcfce7", border: "none", color: "#16a34a", borderRadius: "6px", padding: "0.35rem 0.6rem", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700 }}>
                      Read
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)} style={{ background: "#fee2e2", border: "none", color: "#dc2626", borderRadius: "6px", padding: "0.35rem 0.5rem", cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}