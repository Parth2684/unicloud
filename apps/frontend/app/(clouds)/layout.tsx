import type { Metadata } from "next";
import { ReactNode } from "react";
import WSProvider from "@/components/WSProvider";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Your cloud storage | UniCloud",
  robots: { index: false, follow: false, noarchive: true },
};

export default function CloudLayout({ children }: { children: ReactNode }) {
  return (
    <WSProvider>
      <AppShell>{children}</AppShell>
    </WSProvider>
  );
}
