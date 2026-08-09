import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpticTrader",
    short_name: "OpticTrader",
    description: "A trading journal with AI coaching, built for discretionary traders.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c15",
    theme_color: "#5f5ef5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
