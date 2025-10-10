import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StreamX - Real-time Polling Made Simple",
  description: "Create engaging polls and surveys with real-time results, QR code access, and comprehensive analytics.",
  keywords: ["polling", "surveys", "real-time", "QR code", "analytics", "audience engagement"],
  authors: [{ name: "StreamX Team" }],
  openGraph: {
    title: "StreamX - Real-time Polling Made Simple",
    description: "Create engaging polls and surveys with real-time results",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <RealtimeProvider>
            {children}
            <Toaster />
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
