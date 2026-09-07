import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Newton Development", template: "%s | Newton Development" },
  description: "A public-information tracker for major development, public-building, and transportation projects in Newton, Massachusetts.",
  applicationName: "Newton Development",
  keywords: ["Newton Massachusetts", "Newton development", "Newton projects", "Newton MA development"],
  icons: { icon: "/favicon.ico" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Newton Development",
    description: "Track development, public-building, and transportation projects across Newton, Massachusetts with links to official public records.",
    siteName: "Newton Development",
  },
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
