"use client";

import { useEffect } from "react";

export function GoogleAdBanner() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error", err);
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 728,
        height: 90,
        margin: "32px auto",
        background: "rgba(0,0,0,0.02)",
        border: "1px dashed var(--border-default)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase" }}>Advertisement</span>
      {/* 
        Replace data-ad-client and data-ad-slot with actual IDs when approved by AdSense
      */}
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-XXXXXXXXXXXXXXXX"}
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
