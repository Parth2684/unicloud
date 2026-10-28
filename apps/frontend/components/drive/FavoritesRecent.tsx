"use client";

import { useRouter } from "next/navigation";
import { Clock, Star } from "lucide-react";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { cn } from "@/lib/utils";

export function FavoritesSection() {
  const router = useRouter();
  const favorites = useNavigationStore((s) => s.favorites);
  const navigateTo = useNavigationStore((s) => s.navigateTo);

  if (favorites.length === 0) return null;

  return (
    <section className="space-y-1 px-2">
      <h3 className="flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <Star className="size-3" />
        Favorites
      </h3>
      <ul className="space-y-0.5">
        {favorites.map((fav) => (
          <li key={`${fav.driveId}:${fav.folderId}`}>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 truncate rounded-md px-2 py-1.5 text-left text-sm",
                "text-sidebar-foreground hover:bg-sidebar-accent/70",
              )}
              onClick={() => {
                const href = navigateTo({
                  driveId: fav.driveId,
                  folderId: fav.folderId,
                  path: fav.path,
                });
                router.push(href);
              }}
            >
              <Star className="size-3.5 shrink-0 fill-warning text-warning" />
              <span className="truncate">{fav.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecentSection() {
  const router = useRouter();
  const recent = useNavigationStore((s) => s.recent);
  const navigateTo = useNavigationStore((s) => s.navigateTo);

  if (recent.length === 0) return null;

  return (
    <section className="space-y-1 px-2">
      <h3 className="flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <Clock className="size-3" />
        Recent
      </h3>
      <ul className="space-y-0.5">
        {recent.slice(0, 6).map((item) => (
          <li key={`${item.driveId}:${item.folderId ?? "root"}:${item.visitedAt}`}>
            <button
              type="button"
              className="flex w-full items-center gap-2 truncate rounded-md px-2 py-1.5 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent/70"
              title={item.label}
              onClick={() => {
                const href = navigateTo({
                  driveId: item.driveId,
                  folderId: item.folderId,
                  path: item.path,
                });
                router.push(href);
              }}
            >
              <Clock className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
