import type { Metadata } from "next";

const configuredUrl = process.env.SITE_URL;
export const siteUrl = configuredUrl ? new URL(new URL(configuredUrl).origin) : undefined;
export const siteTitle = "UniCloud – Manage Your Google Drive Accounts in One Place";
export const siteDescription =
  "Bring your Google Drive accounts together with UniCloud. Browse files and folders, manage connected drives, and track storage usage in one organized workspace.";

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
