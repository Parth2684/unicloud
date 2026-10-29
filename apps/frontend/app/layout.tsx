import type { Metadata } from "next";
import { siteDescription, siteTitle, siteUrl } from "@/lib/seo";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { BackendAvailability } from "@/components/BackendAvailability";
import "./globals.css";

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: siteUrl } : {}),
  title: siteTitle,
  description: siteDescription,
  applicationName: "UniCloud",
  robots: { index: true, follow: true },
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const themeBootScript = `
(function() {
  try {
    var key = ${JSON.stringify(STORAGE_KEYS.theme)};
    var stored = localStorage.getItem(key);
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || ((stored === null || stored === 'system') && systemDark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <BackendAvailability>{children}</BackendAvailability>
          <Toaster position="top-center" />
          <Toaster toasterId="job_progress" position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
