import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "http://localhost:3000";
  try {
    return new URL(raw).toString();
  } catch {
    return "http://localhost:3000";
  }
}

const siteUrl = getSiteUrl();
const siteName = "Navios";
const defaultTitle = "Navios | 鹿児島・日置の地域イベント投稿マップ";
const defaultDescription =
  "Naviosは、鹿児島県日置市周辺のイベント・特売・グルメ・地域ニュースを地図で探せる地域情報アプリです。近くの催しを見つけて、投稿・共有できます。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "日置市 イベント",
    "鹿児島 イベント",
    "地域イベント マップ",
    "特売 情報",
    "地元 グルメ 情報",
    "Navios",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    locale: "ja_JP",
    images: [
      {
        url: "/navios-logo.svg",
        width: 512,
        height: 512,
        alt: "Navios ロゴ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/navios-logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
