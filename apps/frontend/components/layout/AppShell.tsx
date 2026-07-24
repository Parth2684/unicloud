"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopToolbar } from "@/components/layout/TopToolbar";
import { CommandPalette } from "@/components/command/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrate = useNavigationStore((s) => s.hydrate);
  const driveId = useNavigationStore((s) => s.driveId);
  const folderId = useNavigationStore((s) => s.folderId);

  useKeyboardShortcuts();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const onDrive = pathname.startsWith("/drive/");
  const pathDriveId = onDrive ? pathname.split("/")[2] : undefined;
  const pathFolderId = onDrive ? pathname.split("/")[3] : undefined;

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar />
      <Sidebar mobile />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopToolbar
          driveId={pathDriveId ?? driveId ?? undefined}
          folderId={pathFolderId ?? folderId}
          showDriveChrome={onDrive}
        />
        <main
          className={cn(
            "min-h-0 flex-1 overflow-auto",
            onDrive && "flex flex-col",
          )}
        >
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
