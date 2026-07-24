"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Cloud,
  HardDrive,
  Home,
  Info,
  LogOut,
  Plus,
  X,
} from "lucide-react";
import { BACKEND_URL } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { FolderTree } from "@/components/drive/FolderTree";
import { FavoritesSection, RecentSection } from "@/components/drive/FavoritesRecent";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { useUserStore } from "@/stores/user/useUserStore";
import { cn } from "@/lib/utils";

type SidebarProps = {
  mobile?: boolean;
};

export function Sidebar({ mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { successCloudAccounts, setClouds } = useCloudStore();
  const { userInfo, setUserInfo } = useUserStore();
  const logout = useAuthStore((s) => s.logout);
  const {
    driveId,
    sidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
    getLastLocation,
    navigateTo,
  } = useNavigationStore();

  useEffect(() => {
    setClouds();
    if (!userInfo) setUserInfo();
  }, [setClouds, setUserInfo, userInfo]);

  const collapsed = !mobile && sidebarCollapsed;
  const showTree = !!driveId && pathname.startsWith("/drive/");

  const content = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-3 py-3">
        <Link
          href="/home"
          className="flex min-w-0 items-center gap-2 font-semibold tracking-tight"
          onClick={() => mobile && setSidebarOpen(false)}
        >
          <Cloud className="size-5 shrink-0 text-primary" />
          {!collapsed && <span className="truncate">UniCloud</span>}
        </Link>
        {mobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <nav className="flex flex-col gap-0.5 px-2 py-3" aria-label="Primary">
        <SidebarLink
          href="/home"
          icon={<Home className="size-4" />}
          label="Home"
          active={pathname === "/home"}
          collapsed={collapsed}
          onClick={() => mobile && setSidebarOpen(false)}
        />
        <SidebarLink
          href="/info"
          icon={<Info className="size-4" />}
          label="Profile & Jobs"
          active={pathname === "/info"}
          collapsed={collapsed}
          onClick={() => mobile && setSidebarOpen(false)}
        />
        <a
          href={`${BACKEND_URL}/auth/drive`}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Plus className="size-4 shrink-0" />
          {!collapsed && <span>Add Drive</span>}
        </a>
      </nav>

      {!collapsed && (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
          <FavoritesSection />
          <RecentSection />

          <section className="space-y-1 px-2">
            <h3 className="flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <HardDrive className="size-3" />
              Drives
            </h3>
            <ul className="space-y-1">
              {(successCloudAccounts ?? []).map((acc) => {
                const id = acc.info.id;
                const active = driveId === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/70",
                      )}
                      onClick={() => {
                        const last = getLastLocation(id);
                        const href = navigateTo(
                          last ?? {
                            driveId: id,
                            path: [{ id: "root", name: "My Drive" }],
                          },
                        );
                        router.push(href);
                        if (mobile) setSidebarOpen(false);
                      }}
                    >
                      <HardDrive className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{acc.info.email}</span>
                    </button>
                    {active && showTree && (
                      <div className="mt-1 ml-1 border-l border-sidebar-border pl-1">
                        <FolderTree driveId={id} />
                      </div>
                    )}
                  </li>
                );
              })}
              {(!successCloudAccounts || successCloudAccounts.length === 0) && (
                <li className="px-2 text-xs text-muted-foreground">No drives linked</li>
              )}
            </ul>
          </section>
        </div>
      )}

      <div className="mt-auto border-t border-sidebar-border p-2">
        <div className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", collapsed && "justify-center")}>
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium">
            {userInfo?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userInfo.image} alt="" className="size-full object-cover" />
            ) : (
              userInfo?.gmail?.charAt(0).toUpperCase() ?? "?"
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{userInfo?.name ?? "Account"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{userInfo?.gmail}</p>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Log out"
            onClick={() => logout()}
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (mobile) {
    if (!sidebarOpen) return null;
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          aria-label="Close navigation drawer"
          onClick={() => setSidebarOpen(false)}
        />
        <aside className="absolute inset-y-0 left-0 w-[min(88vw,20rem)] border-r border-sidebar-border shadow-soft animate-in slide-in-from-left duration-200">
          {content}
        </aside>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "hidden h-svh shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:block",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {content}
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/70",
        collapsed && "justify-center",
      )}
      title={label}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
