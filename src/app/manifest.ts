import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Git Universe",
    short_name: "Git Universe",
    description:
      "Explore GitHub users as planets in a 3D pixel art Universe. Fly through the Universe and discover companies.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#4ADE80",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
