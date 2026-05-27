export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { JetBrains_Mono, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "VibeClock - Proof-of-Build Profiles",
  description:
    "A verified activity layer for AI-native builders, turning sessions, tools, and shipped work into public proof profiles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
