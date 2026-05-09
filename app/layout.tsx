import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/layout/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hantawatch-global.vercel.app"),
  title: {
    default: "HantaWatch — Global Hantavirus Surveillance",
    template: "%s · HantaWatch",
  },
  description:
    "Hantavirus surveillance dashboard aggregating epidemiological signals from WHO, CDC, ECDC, and PAHO sources. Country breakdowns, outbreak alerts, strain reference.",
  keywords: ["hantavirus", "surveillance", "epidemiology", "outbreak", "HCPS", "HFRS", "WHO", "CDC", "ECDC", "PAHO"],
  openGraph: {
    title: "HantaWatch — Global Hantavirus Surveillance",
    description: "Real-time-ish surveillance for hantavirus activity worldwide.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <ThemeProvider />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-blue-500 focus:text-white focus:px-4 focus:py-3 focus:z-50">
          Skip to main content
        </a>
        <div className="grid lg:grid-cols-[280px_1fr] min-h-screen">
          <Sidebar />
          <main id="main" className="px-4 lg:px-8 py-6 lg:py-8 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
