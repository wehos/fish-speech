import type { Metadata } from 'next';
import { Inter as FontSans } from "next/font/google";
import '@/styles/globals.css';
import 'react-h5-audio-player/lib/styles.css';
import { cn } from "@/lib/utils";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: 'Fish Speech Webui',
  description: 'Created by Fish Audio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
      </body>
    </html>
  )
}
