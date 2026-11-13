import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "할 일 목록",
  description: "Next.js + Supabase TODO 앱",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
