import type { Metadata, Viewport } from "next";
import "./globals.css";
import MouseSpotlight from "@/components/MouseSpotlight";
import SupportChatWidget from "@/components/SupportChatWidget";

export const metadata: Metadata = {
  title: "OpticTrader",
  description: "A personal trading journal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OpticTrader",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0c15",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <MouseSpotlight />
        {children}
        <SupportChatWidget />
      </body>
    </html>
  );
}
