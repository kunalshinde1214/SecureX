"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; title: string }> = {
  success: {
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.25)",
    icon: "#34d399",
    title: "#ecfdf5",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.25)",
    icon: "#f87171",
    title: "#fef2f2",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.25)",
    icon: "#fbbf24",
    title: "#fffbeb",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.25)",
    icon: "#60a5fa",
    title: "#eff6ff",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const colors = COLORS[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)",
        maxWidth: 380,
        minWidth: 280,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Progress bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 2,
          background: colors.icon,
          borderRadius: "0 0 12px 12px",
        }}
      />

      <span style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }}>
        {ICONS[toast.type]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: colors.title, lineHeight: 1.3 }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5 }}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: 2,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
  }, []);

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: "error", title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: "warning", title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: "info", title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} style={{ pointerEvents: "all" }}>
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
