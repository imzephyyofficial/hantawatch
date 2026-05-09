import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { JsonLd } from "@/components/json-ld";
import { datasetSchema, organizationSchema } from "@/lib/jsonld";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/api/og"] },
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
        <JsonLd data={[organizationSchema(), datasetSchema()]} />
        <ThemeProvider />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-blue-500 focus:text-white focus:px-4 focus:py-3 focus:z-50">
          Skip to main content
        </a>
        <div className="grid lg:grid-cols-[72px_1fr] xl:grid-cols-[260px_1fr] min-h-screen">
          <Sidebar />
          <main id="main" className="px-4 lg:px-6 xl:px-8 py-6 lg:py-8 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
