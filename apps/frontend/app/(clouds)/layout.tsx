import { ReactNode } from "react";
import WSProvider from "@/components/WSProvider";
import { AppShell } from "@/components/layout/AppShell";

export default function CloudLayout({ children }: { children: ReactNode }) {
  return (
    <WSProvider>
      <AppShell>{children}</AppShell>
    </WSProvider>
  );
}
