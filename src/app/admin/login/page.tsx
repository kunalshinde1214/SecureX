"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Mail, AlertTriangle, Eye, EyeOff, Key } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ssoProvider, setSsoProvider] = useState("");

  // If already authenticated, redirect to /admin directly
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin_auth") === "true") {
      router.push("/admin");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSsoProvider("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email credentials or security access code.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  const handleSSOLogin = (provider: string) => {
    setError("");
    setLoading(true);
    setSsoProvider(provider);

    // Simulate OAuth2 roundtrip callback
    setTimeout(() => {
      localStorage.setItem("admin_auth", "true");
      router.push("/admin");
    }, 1200);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "85vh",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "40px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
          >
            <ShieldAlert size={28} color="var(--accent-primary)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, color: "var(--text-primary)" }}>
            Admin Portal
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
            SecureX Administration Gateway
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              background: "rgba(255, 180, 171, 0.1)",
              border: "1px solid rgba(255, 180, 171, 0.2)",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent-red)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Email field */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Security Admin ID
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                required
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 44, background: "var(--bg-base)" }}
              />
              <Mail size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Access Verification Key
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 44, paddingRight: 48, background: "var(--bg-base)" }}
              />
              <Lock size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8, justifyContent: "center", height: 48 }}>
            {loading ? (ssoProvider ? `Connecting to ${ssoProvider}...` : "Decrypting Access...") : "Acknowledge & Access"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(15, 23, 42, 0.08)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Or Access With Free SSO</span>
          <div style={{ flex: 1, height: 1, background: "rgba(15, 23, 42, 0.08)" }} />
        </div>

        {/* Free Single Sign-On Providers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button
            type="button"
            onClick={() => handleSSOLogin("Google")}
            disabled={loading}
            className="btn-secondary"
            style={{ justifyContent: "center", fontSize: 13, gap: 8, height: 44, cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.99 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.9 3.03C6.32 7.42 8.93 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.56l3.66 2.84c2.14-1.98 3.39-4.89 3.39-8.55z"/>
              <path fill="#FBBC05" d="M5.4 10.53L1.5 7.5C.57 9.38 0 11.56 0 13.92c0 2.36.57 4.54 1.5 6.42l3.9-3.03c-.22-.67-.34-1.38-.34-2.14 0-.76.12-1.47.34-2.14z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.52 1.21-4.3 1.21-3.07 0-5.68-2.38-6.6-5.49L1.5 16.01C3.39 19.85 7.35 22.5 12 22.5z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSSOLogin("GitHub")}
            disabled={loading}
            className="btn-secondary"
            style={{ justifyContent: "center", fontSize: 13, gap: 8, height: 44, cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none" }}>
            ← Return to public audit console
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
