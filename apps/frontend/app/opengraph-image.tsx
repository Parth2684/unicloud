import { ImageResponse } from "next/og";
import { siteTitle } from "@/lib/seo";
export const alt = siteTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        background: "#101827",
        color: "#ffffff",
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700 }}>UniCloud</div>
      <div style={{ fontSize: 40, marginTop: 24, color: "#cbd5e1" }}>
        All your clouds in one place
      </div>
    </div>,
    size,
  );
}
