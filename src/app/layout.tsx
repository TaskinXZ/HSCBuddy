import type { Metadata } from "next";
import "./globals.css";
import { HSCBuddyProvider } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "HSCBuddy — Your Syllabus. Your Progress. Your AI Study Mentor.",
  description:
    "AI-powered personalized study mentor, interactive Syllabus Universe, adaptive study planner, and Chorcha-style mock test engine for Bangladesh HSC Science students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
        <HSCBuddyProvider>
          <AppShell>{children}</AppShell>
        </HSCBuddyProvider>
      </body>
    </html>
  );
}

