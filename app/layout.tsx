import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://newton-development.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Newton Development", template: "%s | Newton Development" },
  description: "A public-information tracker for major development, public-building, and transportation projects in Newton, Massachusetts.",
  applicationName: "Newton Development",
  keywords: ["Newton Massachusetts", "Newton development", "Newton projects", "Newton MA development"],
  icons: { icon: "/icon.svg" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Newton Development",
    description: "Track development, public-building, and transportation projects across Newton, Massachusetts with links to official public records.",
    siteName: "Newton Development",
  },
  twitter: {
    card: "summary",
    title: "Newton Development",
    description: "Track development, public-building, and transportation projects across Newton, Massachusetts.",
  },
};

export const viewport: Viewport = {
  themeColor: "#102a43",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--background)] font-sans text-slate-950">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
