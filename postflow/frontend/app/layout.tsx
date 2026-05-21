import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PostFlow — Social Media Scheduler",
  description:
    "Schedule and auto-publish your Instagram and TikTok posts with PostFlow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#F5F5F0]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
