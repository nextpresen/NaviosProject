import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NaviOs Admin",
  description: "NaviOs 投稿管理MVP"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
