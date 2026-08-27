import type { Metadata, Viewport } from "next";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARTREND — 미술 동향 대시보드",
  description:
    "국내외 갤러리 17곳의 전시 소식, 서울옥션·케이옥션 낙찰 기록, 아트페어 일정, 뉴스와 영상을 한 화면에서.",
  manifest: "/manifest.json",
  applicationName: "ARTREND",
  appleWebApp: {
    capable: true,
    title: "ARTREND",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "ARTREND",
    description: "갤러리 전시, 경매 낙찰 기록, 아트페어 일정을 한 화면에서.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#121210" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
