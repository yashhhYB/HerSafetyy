import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HerSafety - Women Safety App",
    short_name: "HerSafety",
    description:
      "A comprehensive safety app for women in India with emergency response and real-time safety intelligence.",
    start_url: "/",
    display: "standalone",
    background_color: "#2c3e50",
    theme_color: "#2c3e50",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["safety", "emergency", "social"],
    lang: "en",
  }
}
