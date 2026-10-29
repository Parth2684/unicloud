import LandingPage from "@/components/LandingPage";
import { publicPageMetadata, siteDescription, siteTitle } from "@/lib/seo";

export const metadata = publicPageMetadata(siteTitle, siteDescription, "/");

export default function Home() {
  return <LandingPage />;
}
