"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import AdminShell from "../AdminShell";
import {
  Search,
  RefreshCw,
  Check,
  X,
  RotateCcw,
  GraduationCap,
  UserCheck
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-proctored-exam-platform-iv1t.onrender.com";

type Account = {
  id: string;
  name: string;
  email: string;
  role: "Student" | "Examiner" | "Admin";
  status: "Pending" | "Approved" | "Rejected" | "Restricted";
  accountId: string;
  registeredDate: string;
};

export default function AdminUsersView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const fetchUsers = () => {
    const token = localStorage.getItem("access_token") || "";

    fetch(`${API_BASE}/students/admin/all-users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: Account[] = data.map((u, idx) => {
            const roleCap = (u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Student") as Account["role"];
            const statusCap = (u.account_status ? u.account_status.charAt(0).toUpperCase() + u.account_status.slice(1) : "Approved") as Account["status"];
            const prefix = roleCap === "Student" ? "STU" : roleCap === "Examiner" ? "EXM" : "ADM";
            const idNum = String(idx + 1).padStart(4, "0");
            return {
              id: u.id,
              name: u.full_name || u.email.split("@")[0],
              email: u.email,
              role: roleCap,
              status: statusCap,
              accountId: `${prefix}-${idNum}`,
              registeredDate: u.created_at || "01/08/2026",
            };
          });
          setAccounts(mapped);
        } else {
          setAccounts([]);
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") || localStorage.getItem("admin_theme");
    setIsDark(savedTheme === "dark");
    fetchUsers();
  }, []);

  const updateAccountStatus = (id: string, newStatus: Account["status"]) => {
    const token = localStorage.getItem("access_token") || "";

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, status: newStatus } : acc))
    );

    fetch(`${API_BASE}/students/admin/users/${id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ account_status: newStatus.toLowerCase() }),
    }).catch(() => {});
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.accountId.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === "All Roles" || acc.role === roleFilter;

      const matchesStatus =
        statusFilter === "All Statuses" || acc.status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  const cardBg = isDark ? "#0d1424" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const textMain = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#080d19" : "#f8fafc";

  return (
    <AdminShell title="User Management">
      {/* Section Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: textMain, margin: "0 0 0.3rem 0" }}>
          Account Approvals & User Management
        </h2>
        <p style={{ fontSize: "0.88rem", color: textSub, margin: 0 }}>
          Verify new registrations, update roles, and manage active platform accounts.
        </p>
      </div>

      {/* Pending Approvals Alert Banner */}
      {accounts.some((a) => a.status === "Pending") && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fde047",
            borderRadius: "12px",
            padding: "0.9rem 1.2rem",
            marginBottom: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#d97706", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
              !
            </div>
            <div>
              <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#92400e" }}>
                {accounts.filter((a) => a.status === "Pending").length} New Account Registrations Awaiting Approval
              </div>
              <div style={{ fontSize: "0.78rem", color: "#b45309" }}>
                New Student & Examiner sign-ups must be verified before candidates can log in.
              </div>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter("Pending")}
            style={{
              background: "#d97706",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.45rem 0.95rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Filter Pending Only
          </button>
        </div>
      )}

      {/* Filters & Search Row */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "14px", padding: "0.85rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, maxWidth: "500px", background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", padding: "0.55rem 0.85rem" }}>
          <Search size={16} style={{ color: textSub }} />
          <input
            type="text"
            placeholder="Search name, email, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: textMain, width: "100%", fontSize: "0.85rem" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "10px", padding: "0.55rem 0.85rem", fontSize: "0.85rem", outline: "none", cursor: "pointer", fontWeight: 600 }}
          >
            <option value="All Roles">All Roles</option>
            <option value="Student">Student</option>
            <option value="Examiner">Examiner</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textMain, borderRadius: "10px", padding: "0.55rem 0.85rem", fontSize: "0.85rem", outline: "none", cursor: "pointer", fontWeight: 600 }}
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Restricted">Restricted</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("All Roles");
              setStatusFilter("All Statuses");
              fetchUsers();
            }}
            style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textSub, borderRadius: "10px", padding: "0.55rem 0.85rem", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Counter */}
      <div style={{ fontSize: "0.82rem", color: textSub, marginBottom: "1rem", fontWeight: 600 }}>
        Showing {filteredAccounts.length} of {accounts.length} accounts
      </div>

      {/* Account Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {filteredAccounts.map((acc) => {
          const isStudent = acc.role === "Student";
          const isPending = acc.status === "Pending";
          const isRejected = acc.status === "Rejected";
          const isApproved = acc.status === "Approved";

          return (
            <div
              key={acc.id}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "14px",
                padding: "1.1rem 1.4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: isStudent ? "#1e3a8a" : "#581c87",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isStudent ? <GraduationCap size={22} /> : <UserCheck size={22} />}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: textMain }}>{acc.name}</span>

                    <span
                      style={{
                        padding: "0.2rem 0.65rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: isStudent ? "#1d4ed8" : "#6b21a8",
                        color: "#ffffff",
                      }}
                    >
                      {acc.role}
                    </span>

                    <span
                      style={{
                        padding: "0.2rem 0.65rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background:
                          isPending
                            ? (isDark ? "#854d0e" : "#fef08a")
                            : isRejected
                            ? (isDark ? "#991b1b" : "#fee2e2")
                            : isApproved
                            ? (isDark ? "#14532d" : "#dcfce7")
                            : (isDark ? "#991b1b" : "#fee2e2"),
                        color:
                          isPending
                            ? (isDark ? "#fef08a" : "#854d0e")
                            : isRejected
                            ? (isDark ? "#fca5a5" : "#991b1b")
                            : isApproved
                            ? (isDark ? "#bbf7d0" : "#166534")
                            : (isDark ? "#fca5a5" : "#991b1b"),
                      }}
                    >
                      {acc.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: textSub, marginTop: "0.25rem" }}>{acc.email}</div>

                  <div style={{ fontSize: "0.78rem", color: textSub, marginTop: "0.3rem" }}>
                    Registered: {acc.registeredDate}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                {!isApproved && (
                  <button
                    onClick={() => updateAccountStatus(acc.id, "Approved")}
                    style={{
                      background: "transparent",
                      border: "1px solid #16a34a",
                      color: isDark ? "#4ade80" : "#15803d",
                      borderRadius: "8px",
                      padding: "0.45rem 0.9rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <Check size={15} /> Approve
                  </button>
                )}

                {isPending && (
                  <button
                    onClick={() => updateAccountStatus(acc.id, "Rejected")}
                    style={{
                      background: "transparent",
                      border: "1px solid #dc2626",
                      color: isDark ? "#f87171" : "#b91c1c",
                      borderRadius: "8px",
                      padding: "0.45rem 0.9rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <X size={15} /> Reject
                  </button>
                )}

                {isRejected && (
                  <button
                    onClick={() => updateAccountStatus(acc.id, "Pending")}
                    style={{
                      background: "transparent",
                      border: "1px solid #ca8a04",
                      color: isDark ? "#facc15" : "#a16207",
                      borderRadius: "8px",
                      padding: "0.45rem 0.9rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <RotateCcw size={14} /> Move to Pending
                  </button>
                )}

                {isApproved && (
                  <button
                    onClick={() => updateAccountStatus(acc.id, "Restricted")}
                    style={{
                      background: "transparent",
                      border: "1px solid #dc2626",
                      color: isDark ? "#f87171" : "#b91c1c",
                      borderRadius: "8px",
                      padding: "0.45rem 0.9rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <X size={15} /> Restrict
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
