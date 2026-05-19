import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PostFlow — Instagram Post Scheduler",
  description:
    "Schedule and auto-publish your Instagram posts with PostFlow. Plan your content calendar, upload images, write captions, and let automation handle the rest.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <body className="min-h-screen">
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
