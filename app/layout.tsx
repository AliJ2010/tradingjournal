import type { Metadata } from "next";
import "./globals.css";
import MouseSpotlight from "@/components/MouseSpotlight";
import SupportChatWidget from "@/components/SupportChatWidget";

export const metadata: Metadata = {
  title: "OpticTrader",
  description: "A personal trading journal",
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
