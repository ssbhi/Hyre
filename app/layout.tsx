import type { Metadata } from "next";
import { Geist_Mono, Poppins, Roboto, Work_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// Body font — Roboto, per the TrueBalance design system.
const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display font for headings — gives the UI clear typographic contrast.
const poppins = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Wordmark font for the "True Hire" site name.
const workSans = Work_Sans({
  variable: "--font-wordmark",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "True Hire — Hiring & referrals, in one flow",
    template: "%s · True Hire",
  },
  description:
    "Discover and apply to open roles at True Balance. Your data stays private and is used only for your application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${geistMono.variable} ${poppins.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {/* Brand is orange/white/black — light theme only. */}
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
