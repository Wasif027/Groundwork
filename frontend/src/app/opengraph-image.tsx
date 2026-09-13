import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Groundwork — grounded answers over your documents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT = "#d99a4e";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#121110",
          backgroundImage: `radial-gradient(60% 70% at 50% 0%, rgba(217,154,78,0.16), transparent 70%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: 96,
            marginBottom: 36,
          }}
        >
          <div style={{ display: "flex", width: 96, height: 20, borderRadius: 10, background: ACCENT }} />
          <div
            style={{ display: "flex", width: 96, height: 20, borderRadius: 10, background: ACCENT, opacity: 0.68 }}
          />
          <div
            style={{ display: "flex", width: 96, height: 20, borderRadius: 10, background: ACCENT, opacity: 0.42 }}
          />
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#edeae3", letterSpacing: -2 }}>
          Groundwork
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#b2ac9f", marginTop: 18 }}>
          Ask your documents. Get answers you can check.
        </div>
      </div>
    ),
    { ...size },
  );
}
