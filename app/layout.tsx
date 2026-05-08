import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "银龄语音陪伴助手",
  description: "适合老年人使用的中文语音陪伴与生活问答助手",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "语音陪伴"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fffaf0"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
