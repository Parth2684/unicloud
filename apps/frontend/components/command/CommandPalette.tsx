"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, HardDrive, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { cn } from "@/lib/utils";

type PaletteItem = {
  id: string;
  label: string;
  hint?: string;
  kind: "drive" | "favorite" | "recent" | "folder";
  run: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const open = useNavigationStore((s) => s.commandOpen);
  const setCommandOpen = useNavigationStore((s) => s.setCommandOpen);
  const favorites = useNavigationStore((s) => s.favorites);
  const recent = useNavigationStore((s) => s.recent);
  const navigateTo = useNavigationStore((s) => s.navigateTo);
  const getLastLocation = useNavigationStore((s) => s.getLastLocation);
  const drive = useCloudStore((s) => s.drive);
  const successCloudAccounts = useCloudStore((s) => s.successCloudAccounts);

  const close = () => {
    setQuery("");
    setActive(0);
    setCommandOpen(false);
  };
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const list: PaletteItem[] = [];

    (successCloudAccounts ?? []).forEach((acc) => {
      const label = acc.info.email;
      if (!q || label.toLowerCase().includes(q)) {
        list.push({
          id: `drive-${acc.info.id}`,
          label,
          hint: "Drive",
          kind: "drive",
          run: () => {
            const last = getLastLocation(acc.info.id);
            const href = navigateTo(
              last ?? {
                driveId: acc.info.id,
                path: [{ id: "root", name: "My Drive" }],
              },
            );
            router.push(href);
          },
        });
      }
    });

    favorites.forEach((fav) => {
      if (!q || fav.name.toLowerCase().includes(q)) {
        list.push({
          id: `fav-${fav.driveId}-${fav.folderId}`,
          label: fav.name,
          hint: "Favorite",
          kind: "favorite",
          run: () => {
            router.push(
              navigateTo({
                driveId: fav.driveId,
                folderId: fav.folderId,
                path: fav.path,
              }),
            );
          },
        });
      }
    });

    recent.forEach((loc) => {
      if (!q || loc.label.toLowerCase().includes(q)) {
        list.push({
          id: `recent-${loc.driveId}-${loc.folderId ?? "root"}-${loc.visitedAt}`,
          label: loc.label,
          hint: "Recent",
          kind: "recent",
          run: () => {
            router.push(
              navigateTo({
                driveId: loc.driveId,
                folderId: loc.folderId,
                path: loc.path,
              }),
            );
          },
        });
      }
    });

    (drive ?? [])
      .filter((f) => f.mimeType === "application/vnd.google-apps.folder")
      .forEach((folder) => {
        if (!q || folder.name.toLowerCase().includes(q)) {
          const driveId = useNavigationStore.getState().driveId;
          const path = useNavigationStore.getState().path;
          if (!driveId) return;
          list.push({
            id: `folder-${folder.id}`,
            label: folder.name,
            hint: "Current folder",
            kind: "folder",
            run: () => {
              router.push(
                navigateTo({
                  driveId,
                  folderId: folder.id,
                  path: [...path, { id: folder.id, name: folder.name }],
                }),
              );
            },
          });
        }
      });

    // Dedupe by id
    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [query, successCloudAccounts, favorites, recent, drive, getLastLocation, navigateTo, router]);


  if (!open) return null;

  const runItem = (item: PaletteItem) => {
    close()
    item.run();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-soft"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            } }
            placeholder="Search drives and folders…"
            className="border-0 shadow-none focus-visible:ring-0"
            aria-autocomplete="list"
            aria-controls="command-list"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                close()
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && items[active]) {
                e.preventDefault();
                runItem(items[active]);
              }
            }}
          />
        </div>
        <ul id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-1">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</li>
          ) : (
            items.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                    index === active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => runItem(item)}
                >
                  {item.kind === "drive" ? (
                    <HardDrive className="size-4 shrink-0 text-primary" />
                  ) : (
                    <Folder className="size-4 shrink-0 text-primary" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && (
                    <span className="shrink-0 text-xs text-muted-foreground">{item.hint}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
