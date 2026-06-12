import { Metadata } from "next";
import { Mail, Code, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact | WebAudit Pro",
  description: "Get in touch with the WebAudit Pro team.",
};

export default function ContactPage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, marginBottom: 16 }}>
          Get in <span className="gradient-text">Touch</span>
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          Have a question, feature request, or found a bug? We'd love to hear from you.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
        {/* Contact Form Mockup */}
        <div className="glass-card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "var(--text-primary)" }}>
            Send a Message
          </h2>
          <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 8 }}>Name</label>
              <input type="text" className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 8 }}>Email</label>
              <input type="email" className="input-field" placeholder="john@example.com" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 8 }}>Message</label>
              <textarea 
                className="input-field" 
                placeholder="How can we help?" 
                style={{ minHeight: 120, resize: "vertical" }}
              />
            </div>
            <button type="button" className="btn-primary" style={{ marginTop: 8, justifyContent: "center" }}>
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="glass-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}>
              <Mail size={18} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Email</div>
              <a href="mailto:hello@webaudit.pro" style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}>hello@webaudit.pro</a>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
              <Code size={18} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Open Source</div>
              <a href="https://github.com/webauditpro" target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}>github.com/webauditpro</a>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa" }}>
              <MessageCircle size={18} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Twitter / X</div>
              <a href="#" style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}>@WebAuditPro</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
