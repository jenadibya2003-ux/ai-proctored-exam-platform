"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Award,
  BarChart2,
  User,
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";

import LanguageSelector from "../components/LanguageSelector";

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

interface StudentShellProps {
  children: ReactNode;
  title: string;
}

export default function StudentShell({ children, title }: StudentShellProps) {
  const pathname = usePathname();
  const [studentName, setStudentName] = useState("student1");
  const [notifOpen, setNotifOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    const savedTheme = (localStorage.getItem("theme_mode") || localStorage.getItem("student_theme")) as "light" | "dark" | null;
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
            setStudentName(data.full_name);
          }
        })
        .catch(() => {});

      fetchNotifications();
    }
  }, []);

  const handleMarkRead = (id: string) => {
    const token = localStorage.getItem("access_token") || "";
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme_mode", nextTheme);
    localStorage.setItem("student_theme", nextTheme);
    window.dispatchEvent(new Event("themeChange"));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Exams", href: "/student/my-exams", icon: BookOpen },
    { label: "Practice Mocks", href: "/student/mock-tests", icon: FlaskConical },
    { label: "Results & Scorecards", href: "/student/results", icon: Award },
    { label: "Performance Analytics", href: "/student/performance", icon: BarChart2 },
    { label: "Profile Settings", href: "/student/profile", icon: User },
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
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "1rem", borderBottom: "1px solid #1e293b", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>
              S
            </div>
            <div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.92rem" }}>{studentName}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>student</div>
            </div>
          </div>

          {/* Close button inside mobile sidebar */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="mobile-menu-btn"
            style={{ color: "#94a3b8", background: "transparent", border: "none" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  background: isActive ? themeStyles.activeNavBg : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "0.88rem",
                  textDecoration: "none",
                  borderLeft: isActive ? `3px solid ${themeStyles.activeNavBorder}` : "3px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Logout Button */}
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem", marginTop: "0.85rem" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.65rem 0.75rem",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid #1e293b",
              color: "#ef4444",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header Bar */}
        <header style={{ height: "60px", background: themeStyles.headerBg, borderBottom: `1px solid ${themeStyles.cardBorder}`, padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              title="Open Navigation Menu"
              style={{ color: themeStyles.textPrimary, border: `1px solid ${themeStyles.cardBorder}`, background: themeStyles.cardBg }}
            >
              <Menu size={20} />
            </button>

            <h1 style={{ fontSize: "1.05rem", fontWeight: 700, color: themeStyles.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </h1>
          </div>

          {/* Top Right Controls */}
          <div className="header-controls" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LanguageSelector />
            
            {/* Theme Toggle Icon Button */}
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

            {/* Notification Bell */}
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
                {notifications.filter((n) => !n.is_read).length > 0 ? (
                  <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "#ffffff", fontSize: "0.62rem", fontWeight: 800, borderRadius: "10px", padding: "0.1rem 0.35rem" }}>
                    {notifications.filter((n) => !n.is_read).length}
                  </span>
                ) : (
                  <span style={{ position: "absolute", top: "6px", right: "6px", width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />
                )}
              </button>

              {notifOpen && (
                <div style={{ position: "absolute", right: "-40px", top: "44px", width: "min(300px, 88vw)", background: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: "12px", padding: "0.95rem", boxShadow: "0 15px 35px rgba(0,0,0,0.2)", zIndex: 50 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: "0.6rem", color: themeStyles.textPrimary, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Notifications</span>
                    <span style={{ fontSize: "0.65rem", background: "#dbeafe", color: "#1e40af", padding: "0.1rem 0.4rem", borderRadius: "8px", fontWeight: 700 }}>
                      {notifications.length} Total
                    </span>
                  </div>

                  {notifications.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "260px", overflowY: "auto" }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          style={{
                            background: n.is_read ? themeStyles.innerBoxBg : (isDark ? "#1e293b" : "#eff6ff"),
                            border: `1px solid ${themeStyles.cardBorder}`,
                            borderRadius: "8px",
                            padding: "0.55rem 0.65rem",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: themeStyles.textPrimary, display: "flex", justifyContent: "space-between" }}>
                            <span>{n.title}</span>
                            <span style={{ fontSize: "0.65rem", color: themeStyles.textSecondary }}>{n.created_at}</span>
                          </div>
                          <div style={{ color: themeStyles.textSecondary, fontSize: "0.72rem", marginTop: "0.15rem" }}>
                            {n.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: themeStyles.textSecondary, padding: "0.5rem 0", textAlign: "center" }}>
                      No new notifications.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                background: "transparent",
                border: `1px solid ${themeStyles.cardBorder}`,
                color: "#ef4444",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              <LogOut size={15} />
              <span className="header-hide-mobile">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="main-content-area" style={{ flex: 1, padding: "1.5rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}