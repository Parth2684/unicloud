import type { Metadata } from "next";

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const siteUrl = configuredUrl ? new URL(new URL(configuredUrl).origin) : undefined;
export const siteTitle = "UniCloud – All your clouds in one place";
export const siteDescription =
  "Connect your cloud storage accounts with UniCloud. Search across your connected clouds and transfer files between providers in one place.";

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    ...(siteUrl ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "UniCloud",
      title,
      description,
      ...(siteUrl
        ? {
            url: path,
            images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteTitle }],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(siteUrl ? { images: ["/opengraph-image"] } : {}),
    },
  };
}
