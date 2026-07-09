import type { Metadata } from "next";
import { Geist, Geist_Mono, Quicksand } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";

import { appConfig } from "@/config/app";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/shared/toast-provider";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
          <ThemeProvider>
            {children}
            <ToastProvider />
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
