"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, Menu, X, ExternalLink, Zap } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Scanner" },
  { href: "/scans", label: "Recent Scans" },
  { href: "/docs", label: "API Docs" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Skip rendering Navbar on admin pages
  if (pathname?.startsWith("/admin")) return null;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        background: scrolled
          ? "rgba(6, 9, 26, 0.9)"
          : "rgba(6, 9, 26, 0.7)",
        borderBottom: `1px solid ${scrolled ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.06)"}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "all 0.3s ease",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          marginRight: "auto",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(14,165,233,0.35)",
            flexShrink: 0,
          }}
        >
          <Shield size={18} color="white" />
        </div>
        <div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              fontFamily: "'Space Grotesk', sans-serif",
              background: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Secure
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              fontFamily: "'Space Grotesk', sans-serif",
              background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            X
          </span>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            alignSelf: "flex-end",
            paddingBottom: 1,
          }}
        >
          β
        </div>
      </Link>

      {/* Desktop Links */}
      <div
        style={{
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
        className="nav-desktop"
      >
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive ? "rgba(14,165,233,0.1)" : "transparent",
                textDecoration: "none",
                transition: "all 0.2s ease",
                border: isActive ? "1px solid rgba(14,165,233,0.2)" : "1px solid transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: 20 }}>
        <Link
          href="/"
          className="btn-primary"
          style={{ fontSize: 13, padding: "8px 18px", textDecoration: "none" }}
        >
          <Zap size={14} />
          Scan Now
        </Link>
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "none",
            padding: 6,
          }}
          className="nav-mobile-toggle"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 0,
            right: 0,
            background: "rgba(6,9,26,0.97)",
            borderBottom: "1px solid var(--border-default)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            backdropFilter: "blur(20px)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                color: pathname === link.href ? "var(--accent-primary)" : "var(--text-secondary)",
                background: pathname === link.href ? "rgba(14,165,233,0.08)" : "transparent",
                textDecoration: "none",
                border: "none",
                display: "block",
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 8, paddingTop: 12 }}>
            <Link href="/" className="btn-primary" style={{ textDecoration: "none", display: "flex", width: "100%", justifyContent: "center" }}>
              <Zap size={14} /> Scan Now — It&apos;s Free
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
