"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DriveBreadcrumbs } from "@/components/layout/Breadcrumbs";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { cn } from "@/lib/utils";

type TopToolbarProps = {
  driveId?: string;
  folderId?: string;
  showDriveChrome?: boolean;
};

export function TopToolbar({ driveId, folderId, showDriveChrome = false }: TopToolbarProps) {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);

  const {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    folderFilter,
    setFolderFilter,
    setCommandOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    path,
    toggleFavorite,
    isFavorite,
    navigateTo,
    getLastLocation,
  } = useNavigationStore();

  const { setCurrentGoogleFolder, successCloudAccounts, clipboard, pasteHere, clearClipboard } =
    useCloudStore();

  const favorited = driveId && folderId ? isFavorite(driveId, folderId) : false;

  useEffect(() => {
    setFolderFilter("");
  }, [driveId, folderId, setFolderFilter]);

  const refresh = () => {
    if (driveId) setCurrentGoogleFolder(driveId, folderId);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden md:inline-flex"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>

        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Back"
            disabled={!canGoBack()}
            onClick={() => {
              const href = goBack();
              if (href) router.push(href);
            }}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Forward"
            disabled={!canGoForward()}
            onClick={() => {
              const href = goForward();
              if (href) router.push(href);
            }}
          >
            <ArrowRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh"
            disabled={!driveId}
            onClick={refresh}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          {showDriveChrome ? (
            <DriveBreadcrumbs onNavigate={(href) => router.push(href)} />
          ) : (
            <p className="truncate text-sm font-medium text-foreground">UniCloud</p>
          )}
        </div>

        {showDriveChrome && (
          <div
            className={cn(
              "flex w-full items-center gap-2 sm:w-auto sm:max-w-xs",
              searchFocused && "sm:max-w-sm",
            )}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
                placeholder="Search current folder…"
                aria-label="Search current folder"
                className="h-8 pl-8"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>
        )}

        {showDriveChrome && driveId && folderId && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={favorited ? "Remove favorite" : "Add favorite"}
            onClick={() =>
              toggleFavorite({
                driveId,
                folderId,
                name: path[path.length - 1]?.name ?? "Folder",
                path,
              })
            }
          >
            <Star className={cn("size-4", favorited && "fill-warning text-warning")} />
          </Button>
        )}

        {clipboard && driveId && (
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await pasteHere(clipboard.drive_id, clipboard.id, driveId, folderId || "root");
              clearClipboard();
            }}
          >
            Paste
          </Button>
        )}

        {successCloudAccounts && successCloudAccounts.length > 0 && (
          <label className="relative hidden items-center sm:flex">
            <HardDrive className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground" />
            <select
              aria-label="Switch drive"
              className="h-8 appearance-none rounded-md border border-input bg-surface py-1 pr-7 pl-7 text-xs text-foreground"
              value={driveId ?? ""}
              onChange={(e) => {
                const nextDrive = e.target.value;
                const last = getLastLocation(nextDrive);
                const href = navigateTo(
                  last ?? {
                    driveId: nextDrive,
                    path: [{ id: "root", name: "My Drive" }],
                  },
                );
                router.push(href);
              }}
            >
              <option value="" disabled>
                Drive
              </option>
              {successCloudAccounts.map((acc) => (
                <option key={acc.info.id} value={acc.info.id}>
                  {acc.info.email}
                </option>
              ))}
            </select>
          </label>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-3.5" />
          <span className="text-xs text-muted-foreground">Ctrl K</span>
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}
