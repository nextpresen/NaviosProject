import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NaviOs - ライフナビOS",
  description: "生活判断を支援するライフナビOS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
