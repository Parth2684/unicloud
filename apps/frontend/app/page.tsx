import LandingPage from "@/components/LandingPage";
import { publicPageMetadata, siteDescription, siteTitle, siteUrl } from "@/lib/seo";

export const metadata = publicPageMetadata(siteTitle, siteDescription, "/");

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "UniCloud",
    description: siteDescription,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    ...(siteUrl ? { url: siteUrl.href, image: new URL("/opengraph-image", siteUrl).href } : {}),
    featureList: [
      "Connect Google Drive accounts",
      "Browse files and folders",
      "Track storage usage",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}
