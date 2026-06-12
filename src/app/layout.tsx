import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SecureX — Professional Web Security Scanner",
  description: "SecureX runs 15 parallel security checks — SSL/TLS, OWASP Top 10, CVE detection, DNS security, threat intelligence — and delivers a professional security report in under 60 seconds. Free, instant, zero signup.",
  keywords: "web security audit, SSL check, security headers, OWASP, vulnerability scanner, CVE scanner, SecureX, free security tool, penetration testing",
  authors: [{ name: "SecureX", url: "https://securex.kunalshinde.me" }],
  metadataBase: new URL("https://securex.kunalshinde.me"),
  openGraph: {
    title: "SecureX — Professional Web Security Scanner",
    description: "Expose the threats hiding in your website. 15 security checks, real threat intelligence, professional PDF report. Free forever.",
    type: "website",
    url: "https://securex.kunalshinde.me",
    siteName: "SecureX",
    images: [
      {
        url: "https://securex.kunalshinde.me/og-image.png",
        width: 1200,
        height: 630,
        alt: "SecureX — Professional Web Security Scanner",
      },
    ],
  },
  icons: {
    icon: "/slogo.png",
    shortcut: "/slogo.png",
    apple: "/slogo.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "SecureX — Professional Web Security Scanner",
    description: "Expose the threats hiding in your website. 15 security checks, real threat intelligence.",
    site: "@securex",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="canonical" href="https://securex.kunalshinde.me" />
        
        {/* Google AdSense Script Placeholder */}
        <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-XXXXXXXXXXXXXXXX"} />
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-XXXXXXXXXXXXXXXX"}`} crossOrigin="anonymous"></script>
      </head>
      <body>
        <Navbar />
        <main style={{ paddingTop: 64, minHeight: "calc(100vh - 64px - 120px)" }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
