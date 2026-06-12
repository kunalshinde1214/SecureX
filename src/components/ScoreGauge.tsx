"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  lightMode?: boolean;
}

export function ScoreGauge({ score, size = 180, lightMode = false }: ScoreGaugeProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "gauge-excellent";
  let grade = "A+";
  if (score < 90) { colorClass = "gauge-good"; grade = "A"; }
  if (score < 80) { colorClass = "gauge-medium"; grade = "B"; }
  if (score < 60) { colorClass = "gauge-poor"; grade = "C"; }
  if (score < 40) { colorClass = "gauge-critical"; grade = "D"; }
  if (score < 20) { colorClass = "gauge-critical"; grade = "F"; }

  const gradeColor = 
    grade.startsWith("A") ? (lightMode ? "#059669" : "#34d399") :
    grade.startsWith("B") ? (lightMode ? "#059669" : "#10b981") :
    grade.startsWith("C") ? (lightMode ? "#d97706" : "#fbbf24") :
    grade.startsWith("D") ? (lightMode ? "#ea580c" : "#f97316") : (lightMode ? "#dc2626" : "#ef4444");

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Background glow behind gauge */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: size * 0.7, height: size * 0.7, borderRadius: "50%", background: `radial-gradient(circle, ${gradeColor}30 0%, transparent 70%)`, pointerEvents: "none" }} />
      
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "relative", zIndex: 1 }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={lightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={colorClass}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: size * 0.32, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: lightMode ? "#0f172a" : "var(--text-primary)", lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: size * 0.08, color: gradeColor, fontWeight: 800, marginTop: size * 0.02, letterSpacing: 1 }}>
          GRADE {grade}
        </div>
      </div>
    </div>
  );
}
