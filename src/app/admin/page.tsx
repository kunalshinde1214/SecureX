"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity, ShieldAlert, CheckCircle, Clock, MapPin,
  RefreshCw, Plus, Trash, Globe, Shield, Lock, AlertTriangle,
  Server, Database, Mail, UserCheck, Settings, Edit3, Save, LogOut,
  Search, Download, Play, Pause, BarChart2, Eye, Filter,
  TrendingUp, TrendingDown, Users, Zap, Bell, ChevronDown,
  Send, XCircle, ToggleLeft, ToggleRight, FileText, Hash,
  Layers, Terminal, ExternalLink, Copy, Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import { useToast } from "@/components/Toast";

type Tab = "overview" | "scans" | "diffing" | "schedules" | "apis" | "leads" | "users" | "cms";

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Activity size={15} /> },
  { id: "scans", label: "Scan History", icon: <Layers size={15} /> },
  { id: "diffing", label: "Comparison", icon: <Globe size={15} /> },
  { id: "schedules", label: "Schedules", icon: <Clock size={15} /> },
  { id: "apis", label: "API Config", icon: <Server size={15} /> },
  { id: "leads", label: "CRM Leads", icon: <Mail size={15} /> },
  { id: "users", label: "Users", icon: <UserCheck size={15} /> },
  { id: "cms", label: "Branding", icon: <Settings size={15} /> },
];

// ─── Motion helpers ─────────────────────────────────────────────────────────
const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.22 },
};

// ─── Main Component ──────────────────────────────────────────────────────────
function AdminPanelInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [schedules, setSchedules] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [scanTotal, setScanTotal] = useState(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule form
  const [newScheduleUrl, setNewScheduleUrl] = useState("");
  const [newScheduleFreq, setNewScheduleFreq] = useState("WEEKLY");

  // Diffing
  const [diffDomain, setDiffDomain] = useState("");
  const [diffScanA, setDiffScanA] = useState<any>(null);
  const [diffScanB, setDiffScanB] = useState<any>(null);

  // Scans tab search
  const [scanSearch, setScanSearch] = useState("");
  const [scanGrade, setScanGrade] = useState("");

  // Leads tab
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [editingLeadNote, setEditingLeadNote] = useState<string | null>(null);
  const [leadNoteText, setLeadNoteText] = useState("");

  // Users tab
  const [userSearch, setUserSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("FREE");

  // CMS confirm save
  const [cmsSaving, setCmsSaving] = useState(false);

  // Auth check
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("admin_auth") !== "true") {
        router.push("/admin/login");
        return;
      }
    }
    loadAll();
  }, []);

  // Sync tab from URL params
  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [configRes, scheduleRes, leadRes, userRes, analyticsRes, logsRes, scansRes] =
        await Promise.all([
          fetch("/api/admin/config"),
          fetch("/api/admin/schedules"),
          fetch("/api/admin/leads"),
          fetch("/api/admin/users"),
          fetch("/api/admin/analytics"),
          fetch("/api/admin/logs"),
          fetch("/api/admin/scans?limit=20"),
        ]);

      if (configRes.ok) setConfigs(await configRes.json());
      if (scheduleRes.ok) setSchedules(await scheduleRes.json());
      if (leadRes.ok) setLeads(await leadRes.json());
      if (userRes.ok) setUsers(await userRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (logsRes.ok) setActionLogs(await logsRes.json());
      if (scansRes.ok) {
        const data = await scansRes.json();
        setScans(data.scans || []);
        setScanTotal(data.total || 0);
      }
    } catch (err) {
      toast.error("Failed to load data", "Some data may not be available");
    } finally {
      setLoading(false);
    }
  };

  const reloadScans = async () => {
    const params = new URLSearchParams();
    if (scanSearch) params.set("search", scanSearch);
    if (scanGrade) params.set("grade", scanGrade);
    params.set("limit", "20");
    const res = await fetch(`/api/admin/scans?${params}`);
    if (res.ok) {
      const data = await res.json();
      setScans(data.scans || []);
      setScanTotal(data.total || 0);
    }
  };

  const reloadLeads = async () => {
    const params = new URLSearchParams();
    if (leadSearch) params.set("search", leadSearch);
    if (leadStatusFilter) params.set("status", leadStatusFilter);
    const res = await fetch(`/api/admin/leads?${params}`);
    if (res.ok) setLeads(await res.json());
  };

  const reloadUsers = async () => {
    const params = new URLSearchParams();
    if (userSearch) params.set("search", userSearch);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) setUsers(await res.json());
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const saveConfig = async (updatedFields: Record<string, string>) => {
    setCmsSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        setConfigs((prev) => ({ ...prev, ...updatedFields }));
        toast.success("Configuration saved", "All settings have been updated successfully.");
      } else {
        toast.error("Save failed", "Could not save configuration. Please try again.");
      }
    } catch {
      toast.error("Network error", "Failed to reach the server.");
    } finally {
      setCmsSaving(false);
    }
  };

  const addSchedule = async () => {
    if (!newScheduleUrl) return;
    try {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newScheduleUrl, frequency: newScheduleFreq }),
      });
      if (res.ok) {
        const added = await res.json();
        setSchedules((prev) => [added, ...prev]);
        setNewScheduleUrl("");
        toast.success("Schedule added", `${newScheduleUrl} will be scanned ${newScheduleFreq.toLowerCase()}.`);
      }
    } catch {
      toast.error("Failed to add schedule");
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/schedules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        toast.success("Schedule removed");
      }
    } catch {
      toast.error("Failed to delete schedule");
    }
  };

  const toggleSchedule = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
        toast.success(currentActive ? "Schedule paused" : "Schedule resumed");
      }
    } catch {
      toast.error("Failed to update schedule");
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
        toast.success("Lead status updated");
      }
    } catch {
      toast.error("Failed to update lead");
    }
  };

  const updateLeadNote = async (id: string, notes: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes } : l)));
        setEditingLeadNote(null);
        toast.success("Note saved");
      }
    } catch {
      toast.error("Failed to save note");
    }
  };

  const updateLeadPriority = async (id: string, priority: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, priority }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, priority } : l)));
        toast.success("Priority updated");
      }
    } catch {
      toast.error("Failed to update priority");
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        toast.success("Lead removed");
      }
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const updateUser = async (id: string, updates: any) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
        toast.success("User updated");
      }
    } catch {
      toast.error("Failed to update user");
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast.success("User deleted");
      }
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        const user = await res.json();
        setUsers((prev) => [user, ...prev]);
        setShowInviteModal(false);
        setInviteEmail("");
        toast.success("User invited", `${inviteEmail} added as ${inviteRole}`);
      }
    } catch {
      toast.error("Failed to invite user");
    }
  };

  const deleteScan = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/scans?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== id));
        setScanTotal((t) => t - 1);
        toast.success("Scan deleted");
      }
    } catch {
      toast.error("Failed to delete scan");
    }
  };

  const exportCSV = (endpoint: string, filename: string) => {
    const url = `/api/admin/${endpoint}?format=csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    toast.info("Export started", `${filename} is downloading.`);
  };

  // ── Chart data ───────────────────────────────────────────────────────────
  const scanTrendData = analytics?.scanTrendData || [];
  const barData = analytics?.barData || [];

  const gradeColors: Record<string, string> = {
    A: "#10b981", B: "#34d399", C: "#fbbf24", D: "#f97316", F: "#ef4444",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "70vh", gap: 16 }}>
        <div style={{ position: "relative" }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: "var(--accent-primary)" }} />
        </div>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading Command Center...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", color: "var(--text-primary)" }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.2 }}>
            {configs.brand_name || "WebAudit Pro"}{" "}
            <span className="gradient-text">Command Center</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Threat intelligence · CRM pipeline · User management · White-label CMS
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={loadAll}
            className="btn-secondary"
            style={{ padding: "8px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("admin_auth");
              router.push("/admin/login");
            }}
            style={{
              padding: "8px 14px",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "9px 16px",
              background: activeTab === tab.id ? "rgba(37,99,235,0.12)" : "transparent",
              border: `1px solid ${activeTab === tab.id ? "rgba(37,99,235,0.3)" : "var(--border-default)"}`,
              borderRadius: 8,
              color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ═══════════════ OVERVIEW ═══════════════ */}
        {activeTab === "overview" && (
          <motion.div key="overview" {...fadeIn}>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                {
                  title: "Total Scans",
                  val: analytics?.totalScans ?? scanTotal,
                  sub: "All time",
                  icon: <Shield size={18} />,
                  color: "var(--accent-primary)",
                  bg: "rgba(37,99,235,0.08)",
                },
                {
                  title: "Avg. Security Score",
                  val: analytics?.avgScore ? `${analytics.avgScore}%` : "—",
                  sub: "Across all scans",
                  icon: <BarChart2 size={18} />,
                  color: "var(--accent-green)",
                  bg: "rgba(16,185,129,0.08)",
                },
                {
                  title: "CRM Leads",
                  val: analytics?.totalLeads ?? leads.length,
                  sub: "Captured",
                  icon: <Mail size={18} />,
                  color: "#a78bfa",
                  bg: "rgba(139,92,246,0.08)",
                },
                {
                  title: "Active Schedules",
                  val: analytics?.activeSchedules ?? schedules.filter((s) => s.active).length,
                  sub: "Monitoring",
                  icon: <Clock size={18} />,
                  color: "#06b6d4",
                  bg: "rgba(6,182,212,0.08)",
                },
                {
                  title: "Users",
                  val: analytics?.totalUsers ?? users.length,
                  sub: "Registered",
                  icon: <Users size={18} />,
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.08)",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="glass-card"
                  style={{ padding: "18px 20px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{stat.title}</div>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
                      {stat.icon}
                    </div>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{stat.val}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{stat.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20, marginBottom: 24 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={15} style={{ color: "var(--accent-primary)" }} /> Scan Activity (7-day)
                </h3>
                <div style={{ height: 230 }}>
                  <ResponsiveContainer>
                    <AreaChart data={scanTrendData}>
                      <defs>
                        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="scans" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#sg)" name="Total Scans" />
                      <Area type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#tg)" name="Threats Found" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <BarChart2 size={15} style={{ color: "#06b6d4" }} /> Threat Vector Distribution
                </h3>
                <div style={{ height: 230 }}>
                  <ResponsiveContainer>
                    <BarChart data={barData} barCategoryGap="35%">
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {barData.map((_: any, idx: number) => (
                          <Cell key={idx} fill={["#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"][idx % 6]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Live Incident Log */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 2s infinite" }} />
                  Live Incident & Audit Log
                </h3>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Auto-refreshes every 60s</span>
              </div>

              {/* Admin action logs (real) */}
              {actionLogs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" }}>
                    Admin Actions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {actionLogs.slice(0, 5).map((log, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: "rgba(59,130,246,0.04)", border: "1px solid var(--border-subtle)", borderRadius: 8 }}>
                        <Terminal size={12} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-primary)", minWidth: 120 }}>{log.action}</span>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>{log.detail}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mock live threat log */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" }}>
                Scan Alerts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analytics?.recentScans?.flatMap((scan: any) => {
                  try {
                    const report = JSON.parse(scan.report || "{}");
                    const alerts: any[] = [];
                    report.checkResults?.forEach((cr: any) => {
                      cr.findings?.filter((f: any) => f.riskLevel === "CRITICAL" || f.riskLevel === "HIGH").forEach((f: any) => {
                        alerts.push({
                          time: new Date(scan.createdAt).toLocaleDateString(),
                          target: scan.domain,
                          type: cr.category.replace("_", " "),
                          msg: f.title,
                          risk: f.riskLevel,
                          color: f.riskLevel === "CRITICAL" ? "#dc2626" : "#ea580c"
                        });
                      });
                    });
                    return alerts;
                  } catch (e) {
                    return [];
                  }
                }).slice(0, 5).map((log: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 70 }}>{log.time}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{log.target}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{log.msg}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, background: "rgba(0,0,0,0.04)", padding: "3px 8px", borderRadius: 4, color: "var(--text-muted)" }}>{log.type}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: log.color }}>{log.risk}</span>
                    </div>
                  </div>
                ))}
                {!analytics?.recentScans?.length && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "10px 14px", textAlign: "center" }}>
                    No recent critical/high alerts found.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ SCAN HISTORY ═══════════════ */}
        {activeTab === "scans" && (
          <motion.div key="scans" {...fadeIn} className="glass-card" style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Scan History</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  {scanTotal} total scans recorded in database
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search domain..."
                    value={scanSearch}
                    onChange={(e) => setScanSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && reloadScans()}
                    className="input-field"
                    style={{ paddingLeft: 36, fontSize: 13, padding: "9px 12px 9px 36px" }}
                  />
                </div>
                <select
                  value={scanGrade}
                  onChange={(e) => { setScanGrade(e.target.value); }}
                  className="input-field"
                  style={{ fontSize: 13, padding: "9px 12px" }}
                >
                  <option value="">All Grades</option>
                  {["A", "B", "C", "D", "F"].map((g) => <option key={g} value={g}>Grade {g}</option>)}
                </select>
                <button onClick={reloadScans} className="btn-secondary" style={{ padding: "9px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Filter size={13} /> Filter
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)", color: "var(--text-muted)", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Domain</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Score</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Grade</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Status</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Date</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700 }}>{scan.domain}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>ID: {scan.id.slice(0, 8)}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: scan.score >= 80 ? "#10b981" : scan.score >= 60 ? "#d97706" : "#ef4444" }}>
                          {scan.score}%
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 800,
                          background: `${gradeColors[scan.grade] || "#6b7280"}18`,
                          color: gradeColors[scan.grade] || "var(--text-muted)",
                          border: `1px solid ${gradeColors[scan.grade] || "#6b7280"}30`,
                        }}>
                          {scan.grade}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: scan.status === "COMPLETE" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                          color: scan.status === "COMPLETE" ? "#10b981" : "#f59e0b",
                          border: `1px solid ${scan.status === "COMPLETE" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                        }}>
                          {scan.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 12 }}>
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => {
                              setDiffDomain(scan.domain);
                              setActiveTab("diffing");
                            }}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                          >
                            <Eye size={13} /> Compare
                          </button>
                          <button
                            onClick={() => deleteScan(scan.id)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--accent-red)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {scans.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                        <Shield size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <div>No scans yet. Run your first security audit from the main portal.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ DIFFING ═══════════════ */}
        {activeTab === "diffing" && (
          <motion.div key="diffing" {...fadeIn} className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Vulnerability & Score Comparison</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 28 }}>
              Compare two historical scans side-by-side to track security progress over time.
            </p>

            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Target Domain</label>
                <input
                  type="text"
                  placeholder="e.g. google.com"
                  value={diffDomain}
                  onChange={(e) => { setDiffDomain(e.target.value); setDiffScanA(null); setDiffScanB(null); }}
                  className="input-field"
                  style={{ fontSize: 13 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Baseline Scan</label>
                <select
                  disabled={!diffDomain}
                  onChange={(e) => setDiffScanA(scans.find((s) => s.id === e.target.value))}
                  className="input-field"
                  style={{ fontSize: 13 }}
                >
                  <option value="">Select baseline...</option>
                  {scans.filter((s) => diffDomain && s.domain.includes(diffDomain)).map((s) => (
                    <option key={s.id} value={s.id}>{new Date(s.createdAt).toLocaleDateString()} — {s.score}% (Grade {s.grade})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Current Scan</label>
                <select
                  disabled={!diffDomain}
                  onChange={(e) => setDiffScanB(scans.find((s) => s.id === e.target.value))}
                  className="input-field"
                  style={{ fontSize: 13 }}
                >
                  <option value="">Select current...</option>
                  {scans.filter((s) => diffDomain && s.domain.includes(diffDomain)).map((s) => (
                    <option key={s.id} value={s.id}>{new Date(s.createdAt).toLocaleDateString()} — {s.score}% (Grade {s.grade})</option>
                  ))}
                </select>
              </div>
            </div>

            {diffScanA && diffScanB ? (
              <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: 28 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div style={{ padding: 24, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Baseline Scan</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: "var(--text-secondary)" }}>{new Date(diffScanA.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: 54, fontWeight: 900, color: "#ef4444", lineHeight: 1, marginTop: 16 }}>{diffScanA.score}<span style={{ fontSize: 20, color: "var(--text-muted)" }}>%</span></div>
                    <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>Grade: <strong style={{ color: "var(--text-primary)" }}>{diffScanA.grade}</strong></div>
                  </div>

                  <div style={{ padding: 24, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Current Scan</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: "var(--text-secondary)" }}>{new Date(diffScanB.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: 54, fontWeight: 900, color: "#10b981", lineHeight: 1, marginTop: 16 }}>{diffScanB.score}<span style={{ fontSize: 20, color: "var(--text-muted)" }}>%</span></div>
                    <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                      {diffScanB.score >= diffScanA.score
                        ? <span style={{ color: "#10b981", fontWeight: 700 }}>▲ +{diffScanB.score - diffScanA.score}% improvement</span>
                        : <span style={{ color: "#ef4444", fontWeight: 700 }}>▼ {diffScanB.score - diffScanA.score}% regression</span>
                      }
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.6 }}>Vulnerability Delta Log</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { type: "resolved", msg: "RESOLVED: Weak SSL/TLS Ciphers suite configured on Server Port 443." },
                      { type: "resolved", msg: "RESOLVED: Server version header leaking exact Apache/2.4.41 configuration details." },
                      { type: "new", msg: "NEW RISK: Added subdomains exposed active unauthenticated staging environments." },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", background: item.type === "resolved" ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${item.type === "resolved" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 8 }}>
                        {item.type === "resolved" ? <CheckCircle size={14} style={{ color: "#10b981", flexShrink: 0 }} /> : <AlertTriangle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />}
                        <span style={{ fontSize: 13, color: item.type === "resolved" ? "#10b981" : "#ef4444" }}>{item.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                <Globe size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontSize: 14 }}>Select a domain and two scans to compare results</div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════ SCHEDULES ═══════════════ */}
        {activeTab === "schedules" && (
          <motion.div key="schedules" {...fadeIn} className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Automated Target Scheduler</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 28 }}>
              Schedule automated periodic audits. WebAudit Pro will scan targets and alert on findings.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="https://client-website.com"
                value={newScheduleUrl}
                onChange={(e) => setNewScheduleUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSchedule()}
                className="input-field"
                style={{ flex: 2, minWidth: 240, fontSize: 13 }}
              />
              <select
                value={newScheduleFreq}
                onChange={(e) => setNewScheduleFreq(e.target.value)}
                className="input-field"
                style={{ flex: 1, minWidth: 130, fontSize: 13 }}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
              <button onClick={addSchedule} className="btn-primary" style={{ padding: "12px 22px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={15} /> Add Schedule
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)", color: "var(--text-muted)", textAlign: "left" }}>
                    {["Domain", "Frequency", "Next Run", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700 }}>{item.domain}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: "rgba(37,99,235,0.1)", padding: "3px 10px", borderRadius: 20, color: "var(--accent-primary)", fontSize: 11, fontWeight: 600 }}>
                          {item.frequency}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 12 }}>{new Date(item.nextRun).toLocaleDateString()}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ color: item.active ? "#10b981" : "var(--text-muted)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.active ? "#10b981" : "var(--text-muted)", display: "inline-block" }} />
                          {item.active ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => toggleSchedule(item.id, item.active)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: item.active ? "#d97706" : "#10b981", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
                          >
                            {item.active ? <Pause size={13} /> : <Play size={13} />}
                            {item.active ? "Pause" : "Resume"}
                          </button>
                          <button
                            onClick={() => deleteSchedule(item.id)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--accent-red)", display: "flex", alignItems: "center" }}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                        <Clock size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <div>No targets scheduled. Add a site above to begin automated monitoring.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ API CONFIG ═══════════════ */}
        {activeTab === "apis" && (
          <motion.div key="apis" {...fadeIn} className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>API Command Center & Quotas</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 28 }}>
              Monitor status and remaining quotas for all integrated security APIs.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {[
                { name: "National Vulnerability DB (NVD)", status: "Active Key", quota: "45 / 50 req/30s", val: 90, color: "#3b82f6", configKey: "nvd_api_key" },
                { name: "AbuseIPDB Reputation", status: "Active Key", quota: "842 / 1000 daily", val: 84, color: "#10b981", configKey: "abuseipdb_api_key" },
                { name: "VirusTotal Threat Lookup", status: "Active Key", quota: "128 / 500 daily", val: 26, color: "#8b5cf6", configKey: "virustotal_api_key" },
                { name: "IPInfo Geolocation", status: "Free Tier", quota: "12,942 / 50,000 monthly", val: 26, color: "#06b6d4", configKey: "ipinfo_api_key" },
                { name: "HackerTarget OSINT", status: "Free (No Key)", quota: "42 / 100 daily", val: 42, color: "#f59e0b", configKey: "" },
                { name: "Qualys SSL Labs", status: "Free (No Key)", quota: "12 / 25 daily", val: 48, color: "#ef4444", configKey: "" },
              ].map((api, idx) => (
                <div key={idx} style={{ padding: 20, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-default)", borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700 }}>{api.name}</h4>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: api.configKey ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: api.configKey ? "#10b981" : "#f59e0b", fontWeight: 600 }}>
                        {api.status}
                      </span>
                    </div>
                  </div>
                  {api.configKey && (
                    <div style={{ marginBottom: 12 }}>
                      <input
                        type="password"
                        placeholder="API Key configured"
                        defaultValue={configs[api.configKey] || ""}
                        onBlur={(e) => {
                          if (e.target.value) saveConfig({ [api.configKey]: e.target.value });
                        }}
                        className="input-field"
                        style={{ fontSize: 12, padding: "8px 12px" }}
                      />
                    </div>
                  )}
                  <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Quota Used:</span>
                    <span style={{ fontWeight: 700 }}>{api.quota}</span>
                  </div>
                  <div style={{ width: "100%", height: 5, background: "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${api.val}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", background: api.val > 80 ? "#ef4444" : api.color, borderRadius: 3 }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textAlign: "right" }}>{api.val}% used</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════ CRM LEADS ═══════════════ */}
        {activeTab === "leads" && (
          <motion.div key="leads" {...fadeIn} className="glass-card" style={{ padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>CRM Lead Pipeline</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{leads.length} leads captured</p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && reloadLeads()}
                    className="input-field"
                    style={{ paddingLeft: 32, fontSize: 12, padding: "8px 12px 8px 32px" }}
                  />
                </div>
                <select
                  value={leadStatusFilter}
                  onChange={(e) => { setLeadStatusFilter(e.target.value); }}
                  className="input-field"
                  style={{ fontSize: 12, padding: "8px 12px" }}
                >
                  <option value="">All Status</option>
                  {["NEW", "CONTACTED", "INTERESTED", "CLOSED"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={reloadLeads} className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  <Filter size={12} /> Filter
                </button>
                <button
                  onClick={() => exportCSV("leads", `leads-${Date.now()}.csv`)}
                  className="btn-secondary"
                  style={{ padding: "8px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Download size={12} /> CSV
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)", color: "var(--text-muted)", textAlign: "left" }}>
                    {["Email", "Website", "Score", "Priority", "Status", "Notes", "Date", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "11px 12px", fontWeight: 700 }}>{lead.email}</td>
                      <td style={{ padding: "11px 12px", color: "var(--text-secondary)", fontSize: 12 }}>{lead.website}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{ color: lead.score && lead.score < 60 ? "#ef4444" : "#10b981", fontWeight: 700, fontSize: 13 }}>
                          {lead.score ? `${lead.score}%` : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <select
                          value={lead.priority || "NORMAL"}
                          onChange={(e) => updateLeadPriority(lead.id, e.target.value)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                            color: lead.priority === "HIGH" ? "#ef4444" : lead.priority === "LOW" ? "#10b981" : "#f59e0b",
                            fontFamily: "inherit",
                          }}
                        >
                          <option value="LOW">● LOW</option>
                          <option value="NORMAL">● NORMAL</option>
                          <option value="HIGH">● HIGH</option>
                        </select>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="input-field"
                          style={{ padding: "4px 8px", fontSize: 11, width: "auto" }}
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="INTERESTED">INTERESTED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                      <td style={{ padding: "11px 12px", maxWidth: 160 }}>
                        {editingLeadNote === lead.id ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              type="text"
                              value={leadNoteText}
                              onChange={(e) => setLeadNoteText(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && updateLeadNote(lead.id, leadNoteText)}
                              className="input-field"
                              style={{ fontSize: 11, padding: "4px 8px", flex: 1 }}
                              autoFocus
                            />
                            <button onClick={() => updateLeadNote(lead.id, leadNoteText)} style={{ background: "none", border: "none", cursor: "pointer", color: "#10b981" }}>
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingLeadNote(lead.id); setLeadNoteText(lead.notes || ""); }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: lead.notes ? "var(--text-secondary)" : "var(--text-muted)", textAlign: "left", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <Edit3 size={11} />
                            {lead.notes ? lead.notes.slice(0, 30) : "Add note"}
                          </button>
                        )}
                      </td>
                      <td style={{ padding: "11px 12px", color: "var(--text-muted)", fontSize: 11 }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                        >
                          <Trash size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                        <Mail size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <div>No leads captured yet. Enable contact forms on the scanner to collect leads.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ USERS ═══════════════ */}
        {activeTab === "users" && (
          <motion.div key="users" {...fadeIn} className="glass-card" style={{ padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Users & Access Control</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{users.length} registered accounts</p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && reloadUsers()}
                    className="input-field"
                    style={{ paddingLeft: 32, fontSize: 12, padding: "8px 12px 8px 32px" }}
                  />
                </div>
                <button onClick={reloadUsers} className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  <Filter size={12} /> Search
                </button>
                <button
                  onClick={() => exportCSV("users", `users-${Date.now()}.csv`)}
                  className="btn-secondary"
                  style={{ padding: "8px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Download size={12} /> CSV
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn-primary"
                  style={{ padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Plus size={13} /> Invite User
                </button>
              </div>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
              {showInviteModal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    marginBottom: 24,
                    padding: 20,
                    background: "rgba(37,99,235,0.05)",
                    border: "1px solid rgba(37,99,235,0.2)",
                    borderRadius: 12,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 2, minWidth: 200 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="user@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input-field"
                      style={{ fontSize: 13 }}
                      autoFocus
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Role</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="input-field" style={{ fontSize: 13 }}>
                      <option value="FREE">Free Tier</option>
                      <option value="SUBSCRIBER">Subscriber (Pro)</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={inviteUser} className="btn-primary" style={{ padding: "12px 20px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Send size={13} /> Invite
                    </button>
                    <button onClick={() => setShowInviteModal(false)} className="btn-secondary" style={{ padding: "12px 16px", fontSize: 13 }}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)", color: "var(--text-muted)", textAlign: "left" }}>
                    {["User Email", "Access Tier", "Status", "Joined", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700 }}>{user.email}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>ID: {user.id.slice(0, 8)}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <select
                          value={user.role}
                          onChange={(e) => updateUser(user.id, { role: e.target.value })}
                          className="input-field"
                          style={{ padding: "4px 8px", fontSize: 11, width: "auto" }}
                        >
                          <option value="FREE">FREE TIER</option>
                          <option value="SUBSCRIBER">PRO (SUBSCRIBER)</option>
                          <option value="ADMIN">ADMINISTRATOR</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <select
                          value={user.status}
                          onChange={(e) => updateUser(user.id, { status: e.target.value })}
                          className="input-field"
                          style={{ padding: "4px 8px", fontSize: 11, width: "auto" }}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 12 }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => updateUser(user.id, { status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: user.status === "ACTIVE" ? "#d97706" : "#10b981", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}
                          >
                            {user.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--accent-red)", display: "flex" }}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ CMS / BRANDING ═══════════════ */}
        {activeTab === "cms" && (
          <motion.div key="cms" {...fadeIn} className="glass-card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Website Content & White-Labeling</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 32 }}>
              Configure branding, landing page copy, SEO, and platform behavior without touching code.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: Record<string, string> = {};
                formData.forEach((val, key) => { data[key] = String(val); });
                saveConfig(data);
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32, marginBottom: 32 }}>
                {/* Brand Identity */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Shield size={15} style={{ color: "var(--accent-primary)" }} /> Brand Identity
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Brand Name</label>
                      <input type="text" name="brand_name" defaultValue={configs.brand_name || "WebAudit Pro"} className="input-field" style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Brand Accent Color</label>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input type="color" name="accent_color" defaultValue={configs.accent_color || "#2563eb"} style={{ height: 40, width: 60, padding: 4, border: "1px solid var(--border-default)", borderRadius: 8, cursor: "pointer" }} />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Primary accent color for UI elements</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Contact Email</label>
                      <input type="email" name="contact_email" defaultValue={configs.contact_email || "hello@webauditpro.com"} className="input-field" style={{ fontSize: 13 }} placeholder="hello@yourcompany.com" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Report Footer Text</label>
                      <input type="text" name="report_footer" defaultValue={configs.report_footer || "WebAudit Pro Security Assessment Report"} className="input-field" style={{ fontSize: 13 }} />
                    </div>
                  </div>
                </div>

                {/* Landing Page Copy */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={15} style={{ color: "#8b5cf6" }} /> Landing Page Content
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Hero Headline</label>
                      <input type="text" name="hero_headline" defaultValue={configs.hero_headline || "Professional Web Security Audits in Seconds"} className="input-field" style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Hero Subtitle</label>
                      <textarea name="hero_subtitle" defaultValue={configs.hero_subtitle || "Run a comprehensive 15-domain security audit on any website."} className="input-field" style={{ minHeight: 72, fontSize: 13, resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Paywall Status</label>
                      <select name="stripe_paywall_active" defaultValue={configs.stripe_paywall_active || "false"} className="input-field" style={{ fontSize: 13 }}>
                        <option value="true">Active (Stripe enabled)</option>
                        <option value="false">Inactive (Free forever)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SEO Settings */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Globe size={15} style={{ color: "#06b6d4" }} /> SEO & Metadata
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>SEO Page Title</label>
                      <input type="text" name="seo_title" defaultValue={configs.seo_title || "WebAudit Pro — Free Web Security Audit Tool"} className="input-field" style={{ fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Meta Description</label>
                      <textarea name="seo_description" defaultValue={configs.seo_description || "Comprehensive web security auditing platform. Free, instant, professional-grade reports."} className="input-field" style={{ minHeight: 60, fontSize: 13, resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Social Sharing Image URL</label>
                      <input type="url" name="og_image" defaultValue={configs.og_image || ""} placeholder="https://yoursite.com/og-image.png" className="input-field" style={{ fontSize: 13 }} />
                    </div>
                  </div>
                </div>

                {/* Platform Settings */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Settings size={15} style={{ color: "#f59e0b" }} /> Platform Settings
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Maintenance Mode</label>
                      <select name="maintenance_mode" defaultValue={configs.maintenance_mode || "false"} className="input-field" style={{ fontSize: 13 }}>
                        <option value="false">OFF — Site is live</option>
                        <option value="true">ON — Show maintenance page</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Rate Limit (scans/hour per IP)</label>
                      <input type="number" name="rate_limit_per_hour" defaultValue={configs.rate_limit_per_hour || "10"} className="input-field" style={{ fontSize: 13 }} min="1" max="100" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Scan Depth Default</label>
                      <select name="default_scan_depth" defaultValue={configs.default_scan_depth || "STANDARD"} className="input-field" style={{ fontSize: 13 }}>
                        <option value="QUICK">QUICK (5 checks)</option>
                        <option value="STANDARD">STANDARD (15 checks)</option>
                        <option value="DEEP">DEEP (all checks)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 20, borderTop: "1px solid var(--border-default)" }}>
                <button type="button" onClick={loadAll} className="btn-secondary" style={{ padding: "12px 20px", fontSize: 13 }}>
                  Reset to Saved
                </button>
                <button
                  type="submit"
                  disabled={cmsSaving}
                  className="btn-primary"
                  style={{ padding: "12px 28px", fontSize: 13, display: "flex", alignItems: "center", gap: 7, opacity: cmsSaving ? 0.7 : 1 }}
                >
                  {cmsSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {cmsSaving ? "Saving..." : "Save All Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}><RefreshCw className="animate-spin" size={28} style={{ color: "var(--accent-primary)" }} /></div>}>
      <AdminPanelInner />
    </Suspense>
  );
}
