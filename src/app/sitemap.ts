import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";
import { INSTITUTIONAL_COMPANIES } from "@/lib/company-catalog";

const BASE_URL = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    ...["intro", "roadmap", "advertise", "support", "privacy", "terms"].map(
      (path) => ({
        url: `${BASE_URL}/${path}`,
        changeFrequency: "monthly" as const,
        priority: path === "intro" ? 0.8 : 0.5,
      })
    ),
    ...INSTITUTIONAL_COMPANIES.map((company) => ({
      url: `${BASE_URL}/empresas/${company.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
