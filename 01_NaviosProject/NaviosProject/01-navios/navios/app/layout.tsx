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
const defaultTitle = "Navios | 世界のまちをつなぐイベント投稿マップ";
const defaultDescription =
  "Naviosは、イベント・特売・グルメ・地域ニュースを地図で見つけて投稿・共有できるコミュニティアプリです。日本全国から世界へ、いまこの場所の情報をリアルタイムで届けます。";

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
    "イベント マップ",
    "地域情報 アプリ",
    "全国 イベント",
    "海外 イベント",
    "ローカルニュース 共有",
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
