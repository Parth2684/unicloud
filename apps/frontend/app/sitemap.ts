import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];
  return ["/", "/privacy-policy", "/terms-of-service"].map((path) => ({
    url: new URL(path, siteUrl).href,
  }));
}
