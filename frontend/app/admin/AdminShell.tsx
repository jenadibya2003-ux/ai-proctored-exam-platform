"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Database,
  Lock,
  User,
  Menu,
  X
} from "lucide-react";

import LanguageSelector from "../components/LanguageSelector";

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `http://${host}:8000`;
    }
  }
  return envUrl || "https://ai-proctored-exam-platform-iv1t.onrender.com";
};
const API_BASE = getApiBase();

interface AdminShellProps {
  children: ReactNode;
  title: string;
}

export default function AdminShell({ children, title }: AdminShellProps) {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("admin1");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Broadcast modal form state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTargetRole, setBroadcastTargetRole] = useState("all");
  const [broadcastSending, setBroadcastSending] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const fetchNotifications = () => {
    const token = localStorage.getItem("access_token") || "";
    if (token) {
      fetch(`${API_BASE}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme_mode") || localStorage.getItem("admin_theme")) as "light" | "dark" | null;
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    const token = localStorage.getItem("access_token") || "";
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.full_name) {
            setAdminName(data.full_name);
          }
        })
        .catch(() => {});

      fetch(`${API_BASE}/students/admin/pending-users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setPendingUsers(data);
          }
        })
        .catch(() => {});

      fetchNotifications();
    }
  }, []);

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setBroadcastSending(true);
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/notifications/admin/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: broadcastTitle,
        message: broadcastMessage,
        target_role: broadcastTargetRole,
        category: "announcement",
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === "success") {
          alert("Announcement broadcast successfully!");
          setBroadcastTitle("");
          setBroadcastMessage("");
          setBroadcastModalOpen(false);
          fetchNotifications();
        }
      })
      .catch(() => {})
      .finally(() => setBroadcastSending(false));
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem("access_token") || "";
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    fetch(`${API_BASE}/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme_mode", nextTheme);
    localStorage.setItem("admin_theme", nextTheme);
    window.dispatchEvent(new Event("themeChange"));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Proctoring Logs", href: "/admin/proctoring-logs", icon: ShieldCheck },
    { label: "System Analytics", href: "/admin/reports", icon: BarChart3 },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const isDark = theme === "dark";

  const themeStyles = {
    pageBg: isDark ? "#060913" : "#f8fafc",
    sidebarBg: "#0f172a",
    sidebarText: "#cbd5e1",
    headerBg: isDark ? "#090d16" : "#ffffff",
    cardBg: isDark ? "#0b1222" : "#ffffff",
    cardBorder: isDark ? "#1e293b" : "#e2e8f0",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    innerBoxBg: isDark ? "#080d19" : "#f1f5f9",
    activeNavBg: "#1e293b",
    activeNavBorder: "#3b82f6",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: themeStyles.pageBg, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Mobile Dark Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Dark Sidebar Drawer */}
      <aside
        className={`app-sidebar ${mobileMenuOpen ? "open" : ""}`}
        style={{
          width: "230px",
          flexShrink: 0,
          background: themeStyles.sidebarBg,
          padding: "1.1rem 0.85rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "1rem", borderBottom: "1px solid #1e293b", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>
              A
            </div>
            <div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.92rem" }}>{adminName}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>admin</div>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="mobile-menu-btn"
            style={{ color: "#94a3b8", background: "transparent", border: "none" }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  padding: "0.55rem 0.8rem",
                  borderRadius: "8px",
                  background: isActive ? themeStyles.activeNavBg : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  borderLeft: isActive ? `3px solid ${themeStyles.activeNavBorder}` : "3px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem", marginTop: "0.85rem" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.55rem 0.75rem",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid #1e293b",
              color: "#ef4444",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ height: "60px", background: themeStyles.headerBg, borderBottom: `1px solid ${themeStyles.cardBorder}`, padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              title="Open Navigation Menu"
              style={{ color: themeStyles.textPrimary, border: `1px solid ${themeStyles.cardBorder}`, background: themeStyles.cardBg }}
            >
              <Menu size={20} />
            </button>

            <h1 className="header-title" style={{ fontSize: "1.05rem", fontWeight: 700, color: themeStyles.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </h1>
          </div>

          {/* Top Right Controls */}
          <div className="header-controls" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LanguageSelector />

            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: themeStyles.cardBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                color: themeStyles.textPrimary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                transition: "all 0.15s ease",
              }}
            >
              {isDark ? <Sun size={16} style={{ color: "#eab308" }} /> : <Moon size={16} style={{ color: "#6366f1" }} />}
            </button>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                title="Notifications"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: themeStyles.cardBg,
                  border: `1px solid ${themeStyles.cardBorder}`,
                  color: themeStyles.textPrimary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <Bell size={16} />
                {notifications.filter((n) => !n.is_read).length > 0 || pendingUsers.length > 0 ? (
                  <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "#ffffff", fontSize: "0.62rem", fontWeight: 800, borderRadius: "10px", padding: "0.1rem 0.35rem" }}>
                    {notifications.filter((n) => !n.is_read).length + pendingUsers.length}
                  </span>
                ) : (
                  <span style={{ position: "absolute", top: "6px", right: "6px", width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />
                )}
              </button>

              {notifOpen && (
                <div className="notif-panel" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, padding: "0.95rem" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: "0.6rem", color: themeStyles.textPrimary, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Notifications ({notifications.length})</span>
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        setBroadcastModalOpen(true);
                      }}
                      style={{
                        fontSize: "0.68rem",
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      + Broadcast
                    </button>
                  </div>

                  {pendingUsers.length > 0 && (
                    <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "0.5rem", marginBottom: "0.6rem", fontSize: "0.75rem", color: "#991b1b" }}>
                      <strong>{pendingUsers.length} new user(s)</strong> awaiting Admin approval.{" "}
                      <Link href="/admin/users" onClick={() => setNotifOpen(false)} style={{ color: "#1e40af", fontWeight: 700 }}>
                        Review →
                      </Link>
                    </div>
                  )}

                  {notifications.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "260px", overflowY: "auto" }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            background: themeStyles.innerBoxBg,
                            border: `1px solid ${themeStyles.cardBorder}`,
                            borderRadius: "8px",
                            padding: "0.55rem 0.65rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: themeStyles.textPrimary, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{n.title}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span style={{ fontSize: "0.62rem", color: themeStyles.textSecondary }}>{n.created_at}</span>
                              <button
                                onClick={(e) => handleDeleteNotification(n.id, e)}
                                title="Delete Notification"
                                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.7rem", padding: "0 0.2rem" }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div style={{ color: themeStyles.textSecondary, fontSize: "0.72rem", marginTop: "0.15rem" }}>
                            {n.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: themeStyles.textSecondary, padding: "0.5rem 0", textAlign: "center" }}>
                      No notifications recorded.
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: themeStyles.cardBg,
                border: `1px solid ${themeStyles.cardBorder}`,
                color: "#ef4444",
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <LogOut size={14} />
              <span className="header-hide-mobile">Sign Out</span>
            </button>

            <div style={{ position: "relative" }} className="header-hide-mobile">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: themeStyles.cardBg,
                  border: `1px solid ${themeStyles.cardBorder}`,
                  padding: "0.35rem 0.7rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700 }}>
                  A
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: themeStyles.textPrimary }}>{adminName}</span>
                <ChevronDown size={14} style={{ color: themeStyles.textSecondary }} />
              </button>

              {userDropdown && (
                <div style={{ position: "absolute", right: 0, top: "42px", width: "180px", background: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: "10px", padding: "0.4rem", boxShadow: "0 15px 35px rgba(0,0,0,0.2)", zIndex: 50 }}>
                  <Link
                    href="/admin/settings"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.7rem", borderRadius: "6px", fontSize: "0.78rem", color: themeStyles.textPrimary, textDecoration: "none" }}
                  >
                    <Settings size={14} /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.7rem", borderRadius: "6px", fontSize: "0.78rem", color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className="main-content-area"
          style={{ flex: 1, padding: "1.5rem", overflowX: "hidden", width: "100%", boxSizing: "border-box" }}
        >
          {children}
        </main>

        {/* Broadcast Announcement Modal */}
        {broadcastModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1.2rem" }}>
            <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: "16px", padding: "1.6rem", maxWidth: "480px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", borderBottom: `1px solid ${themeStyles.cardBorder}`, paddingBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: themeStyles.textPrimary, margin: 0 }}>
                  Broadcast New Announcement
                </h3>
                <button onClick={() => setBroadcastModalOpen(false)} style={{ background: "transparent", border: "none", color: themeStyles.textSecondary, cursor: "pointer", fontSize: "1rem" }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateBroadcast} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: themeStyles.textSecondary, marginBottom: "0.3rem" }}>
                    ANNOUNCEMENT TITLE
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midterm Examination Schedule Update"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: `1px solid ${themeStyles.cardBorder}`, background: themeStyles.innerBoxBg, color: themeStyles.textPrimary, fontSize: "0.85rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: themeStyles.textSecondary, marginBottom: "0.3rem" }}>
                    TARGET AUDIENCE
                  </label>
                  <select
                    value={broadcastTargetRole}
                    onChange={(e) => setBroadcastTargetRole(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: `1px solid ${themeStyles.cardBorder}`, background: themeStyles.innerBoxBg, color: themeStyles.textPrimary, fontSize: "0.85rem", outline: "none" }}
                  >
                    <option value="all">All Platform Users (Students & Examiners)</option>
                    <option value="student">Students Only</option>
                    <option value="examiner">Examiners Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: themeStyles.textSecondary, marginBottom: "0.3rem" }}>
                    ANNOUNCEMENT MESSAGE
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter detailed notification news message..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: `1px solid ${themeStyles.cardBorder}`, background: themeStyles.innerBoxBg, color: themeStyles.textPrimary, fontSize: "0.85rem", outline: "none", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
                  <button type="button" onClick={() => setBroadcastModalOpen(false)} style={{ background: themeStyles.innerBoxBg, border: `1px solid ${themeStyles.cardBorder}`, color: themeStyles.textPrimary, borderRadius: "8px", padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={broadcastSending} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.5rem 1.2rem", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                    {broadcastSending ? "Broadcasting..." : "Broadcast Announcement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}