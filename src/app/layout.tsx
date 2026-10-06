import type { Metadata, Viewport } from "next";
import { Cinzel, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const script = Great_Vibes({ variable: "--font-script-face", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "LisaMarie Artistry",
  description: "Bookings, clients and income for LisaMarie Artistry.",
  applicationName: "LisaMarie",
  appleWebApp: { capable: true, title: "LisaMarie", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} ${script.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
