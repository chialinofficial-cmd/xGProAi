import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://xgpro.ai"),
  title: {
    default: "xGPro | Institutional Gold Analysis AI",
    template: "%s | xGPro"
  },
  description: "AI-powered XAU/USD technical analysis for professional traders. Spot liquidity grabs, market structure, and directional bias instantly with our institutional-grade algorithms.",
  keywords: ["Forex", "Gold Trading", "XAUUSD", "AI Trading", "Technical Analysis", "Smart Money Concepts", "ICT", "TradingView"],
  authors: [{ name: "xGPro Team" }],
  creator: "xGPro",
  publisher: "xGPro",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://xgpro.ai",
    siteName: "xGPro | Institutional Gold Analysis",
    title: "xGPro | Institutional Gold Analysis AI",
    description: "AI-powered XAU/USD technical analysis for professional traders. Spot liquidity grabs, market structure, and directional bias instantly.",
    images: [
      {
        url: "/og-image.png", // We will need to ensure this exists or use a placeholder
        width: 1200,
        height: 630,
        alt: "xGPro AI Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "xGPro | Institutional Gold Analysis AI",
    description: "AI-powered XAU/USD technical analysis for professional traders.",
    creator: "@xGProAI",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  other: {
    "cryptomus": "77b493d5",
  },
};

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
