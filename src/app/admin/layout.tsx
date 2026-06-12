"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Globe, Clock, Server, Mail, UserCheck, Settings,
  ShieldAlert, List, FileText, Activity, ExternalLink, ChevronRight,
} from "lucide-react";
import { ToastProvider } from "@/components/Toast";

const NAV_ITEMS = [
  { href: "/admin", label: "Command Center", icon: <LayoutDashboard size={17} />, exact: true },
  { href: "/admin?tab=scans", label: "Scan History", icon: <List size={17} /> },
  { href: "/admin?tab=diffing", label: "Scan Comparison", icon: <Globe size={17} /> },
  { href: "/admin?tab=schedules", label: "Scheduled Audits", icon: <Clock size={17} /> },
  { href: "/admin?tab=apis", label: "API Config", icon: <Server size={17} /> },
  { href: "/admin?tab=leads", label: "CRM Leads", icon: <Mail size={17} /> },
  { href: "/admin?tab=users", label: "Users & Access", icon: <UserCheck size={17} /> },
  { href: "/admin?tab=cms", label: "Branding & CMS", icon: <Settings size={17} /> },
];

const EXTERNAL_LINKS = [
  { href: "/", label: "Public Scan Portal", icon: <ExternalLink size={15} /> },
  { href: "/docs", label: "API Documentation", icon: <FileText size={15} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoot = pathname === "/admin";

  return (
    <ToastProvider>
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 256,
            borderRight: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding: "24px 20px 20px",
              borderBottom: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #2563eb, #0891b2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(37,99,235,0.3)",
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={19} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.2, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
                SecureX
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 0.5, marginTop: 1, fontWeight: 700 }}>
                ADMIN CONSOLE
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-default)" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                color: "#34d399",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  animation: "pulse 2s infinite",
                }}
              />
              Threat Engine Online
            </div>
          </div>

          {/* Main Nav */}
          <nav style={{ flex: 1, padding: "16px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1, padding: "0 8px", marginBottom: 8, textTransform: "uppercase" }}>
              Management
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV_ITEMS.map((item) => {
                const isActive = isAdminRoot && item.exact
                  ? !item.href.includes("?tab=")
                  : false; // Active state managed by tab in page
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 8,
                      color: "var(--text-secondary)",
                      fontSize: 13.5,
                      fontWeight: 500,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                    className="admin-nav-item"
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: "var(--text-muted)", display: "flex" }}>{item.icon}</span>
                      {item.label}
                    </span>
                    <ChevronRight size={12} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--border-default)", margin: "16px 0" }} />

            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1, padding: "0 8px", marginBottom: 8, textTransform: "uppercase" }}>
              Quick Access
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {EXTERNAL_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.href === "/" ? undefined : "_blank"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    color: "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                  className="admin-nav-item"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                admin@securex.kunalshinde.me
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Super Admin</div>
            </div>
            <Activity size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "36px 44px", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
