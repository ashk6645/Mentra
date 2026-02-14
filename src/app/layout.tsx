import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/lib/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { GlobalErrorBoundary } from "@/components/shared/global-error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mentra - Premium Task & Life Management",
    template: "%s | Mentra",
  },
  description: "A production-grade task management application with AI-powered features and mental health-friendly design. Achieve more with less stress.",
  keywords: ["task management", "productivity", "todo", "GTD", "project management", "AI assistant", "Mentra"],
  authors: [{ name: "Mentra Team" }],
  creator: "Mentra",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mentra.app",
    title: "Mentra - Premium Task & Life Management",
    description: "Transform your productivity with AI-powered task management",
    siteName: "Mentra",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentra - Premium Task & Life Management",
    description: "Transform your productivity with AI-powered task management",
    creator: "@mentra",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon is handled automatically by Next.js via icon.svg in app directory */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalErrorBoundary>
          <Providers>{children}</Providers>
          <Toaster />
          <SonnerToaster
            position="bottom-right"
            expand={false}
            richColors
            closeButton
            duration={3000}
          />
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
