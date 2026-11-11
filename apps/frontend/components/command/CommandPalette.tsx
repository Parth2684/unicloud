"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal, LoaderCircle, Folder, File } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { rootPath } from "@/stores/navigation/types";
import { searchCloudFiles, type SearchMimeType, type SearchOrderBy } from "@/api/cloud";
import type { DriveFile, SuccessCloudAccount } from "@/stores/cloud/types";

type SearchRow = { file: DriveFile; driveId: string };
const MIME_OPTIONS: [SearchMimeType, string][] = [
  ["image/", "Images"],
  ["video/", "Videos"],
  ["audio/", "Audio"],
  ["application/pdf", "PDFs"],
  ["application/vnd.google-apps.folder", "Folders"],
];
const EMPTY_ACCOUNTS: SuccessCloudAccount[] = [];

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useNavigationStore((s) => s.commandOpen);
  const setCommandOpen = useNavigationStore((s) => s.setCommandOpen);
  const path = useNavigationStore((s) => s.path);
  const navigateTo = useNavigationStore((s) => s.navigateTo);
  const accounts = useCloudStore((s) => s.successCloudAccounts) ?? EMPTY_ACCOUNTS;
  const routeParts = pathname.split("/").filter(Boolean);
  const currentDriveId = routeParts[0] === "drive" ? routeParts[1] : undefined;
  const currentFolderId = routeParts[0] === "drive" ? routeParts[2] : undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedDrives, setSelectedDrives] = useState<string[] | null>(() =>
    currentDriveId ? [currentDriveId] : null,
  );
  const [mimeTypes, setMimeTypes] = useState<SearchMimeType[]>([]);
  const [orderBy, setOrderBy] = useState<SearchOrderBy | "">("");
  const [scopeToFolder, setScopeToFolder] = useState(false);
  const [results, setResults] = useState<SearchRow[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const availableDrives = useMemo(() => accounts.map((a) => a.info), [accounts]);
  const activeDriveIds = selectedDrives ?? availableDrives.map((a) => a.id);
  const close = () => {
    setQuery("");
    setResults([]);
    setTokens({});
    setError("");
    setHasSearched(false);
    setMimeTypes([]);
    setOrderBy("");
    setScopeToFolder(false);
    setSelectedDrives(currentDriveId ? [currentDriveId] : null);
    setCommandOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const search = async (page = false) => {
    const term = query.trim();
    if (!term || activeDriveIds.length === 0 || loading) return;
    const requestedIds = page ? activeDriveIds.filter((id) => Boolean(tokens[id])) : activeDriveIds;
    if (!requestedIds.length) return;
    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const driveTokens = Object.fromEntries(
        requestedIds.map((id) => [id, page ? tokens[id] : null]),
      );
      const data = await searchCloudFiles(term, driveTokens, mimeTypes, {
        orderBy: orderBy || undefined,
        parentFolderId: scopeToFolder && currentFolderId ? currentFolderId : undefined,
      });
      const rows = data.search_results.flatMap(([result, id]) =>
        result.files.map((file) => ({ file, driveId: id })),
      );
      setResults((previous) => (page ? [...previous, ...rows] : rows));
      setTokens((previous) => {
        const next = page ? { ...previous } : {};
        requestedIds.forEach((id) => {
          delete next[id];
        });
        data.search_results.forEach(([result, id]) => {
          if (result.nextPageToken) next[id] = result.nextPageToken;
        });
        return next;
      });
    } catch {
      setError("Search could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openParent = (row: SearchRow) => {
    const parentId = row.file.parents?.[0];
    if (!parentId) {
      router.push(`/drive/${row.driveId}`);
    } else {
      const parentPath =
        row.driveId === currentDriveId && path.length > 0
          ? [...path.slice(0, -1), { id: parentId, name: "Parent folder" }]
          : [...rootPath(), { id: parentId, name: "Parent folder" }];
      router.push(navigateTo({ driveId: row.driveId, folderId: parentId, path: parentPath }));
    }
    close();
  };

  if (!open) return null;
  const hasNextPage = activeDriveIds.some((id) => Boolean(tokens[id]));

  return (
    <div
      className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-[7vh] backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Search cloud files"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <Search className="size-5 shrink-0 text-primary" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
              }}
              placeholder="Search your cloud files…"
              aria-label="Search your cloud files"
              className="h-10 border-0 px-0 text-base shadow-none focus-visible:ring-0"
            />
            <kbd className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="grid min-h-0 gap-5 overflow-y-auto p-4 md:flex-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:overflow-hidden md:p-5">
            <div className="min-w-0 space-y-3 md:overflow-y-auto md:pr-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="size-4 text-muted-foreground" /> Filters
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Search in drives</p>
                <div className="max-h-28 space-y-2 overflow-y-auto">
                  {availableDrives.map((account) => (
                    <label
                      key={account.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedDrives === null || selectedDrives.includes(account.id)}
                        onChange={(e) =>
                          setSelectedDrives((ids) => {
                            const current = ids ?? availableDrives.map((drive) => drive.id);
                            return e.target.checked
                              ? [...new Set([...current, account.id])]
                              : current.filter((id) => id !== account.id);
                          })
                        }
                      />
                      <span className="truncate">{account.email}</span>
                    </label>
                  ))}
                  {availableDrives.length === 0 && (
                    <p className="text-xs text-muted-foreground">No connected drives found.</p>
                  )}
                </div>
              </div>
              {currentFolderId && (
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-primary"
                    checked={scopeToFolder}
                    onChange={(e) => setScopeToFolder(e.target.checked)}
                  />
                  <span>
                    <span className="block font-medium">Only this folder</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Limit results to the current folder.
                    </span>
                  </span>
                </label>
              )}
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">File types</p>
                <div className="grid grid-cols-2 gap-y-2">
                  {MIME_OPTIONS.map(([mime, label]) => (
                    <label key={mime} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={mimeTypes.includes(mime)}
                        onChange={(e) =>
                          setMimeTypes((items) =>
                            e.target.checked
                              ? [...items, mime]
                              : items.filter((item) => item !== mime),
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="block text-xs font-medium text-muted-foreground">
                Sort results
                <select
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value as SearchOrderBy | "")}
                >
                  <option value="">Relevance</option>
                  <option value="modifiedTime desc">Recently modified</option>
                  <option value="modifiedTime">Least recently modified</option>
                  <option value="starred">Starred</option>
                  <option value="quotaBytesUsed desc">Largest first</option>
                  <option value="quotaBytesUsed">Smallest first</option>
                </select>
              </label>
            </div>
            <div className="flex min-h-72 min-w-0 max-h-[56vh] flex-col overflow-hidden rounded-xl border border-border bg-background/50">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Results</p>
                {hasSearched && (
                  <span className="text-xs text-muted-foreground">{results.length} found</span>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                {!hasSearched && (
                  <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
                    <Search className="mb-3 size-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Ready when you are</p>
                    <p className="mt-1 max-w-52 text-xs text-muted-foreground">
                      Enter a search term to find files across your connected drives.
                    </p>
                  </div>
                )}
                {hasSearched && results.length === 0 && !loading && !error && (
                  <p className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No files found. Try a different query or filter.
                  </p>
                )}
                {results.map((row, index) => (
                  <button
                    key={`${row.driveId}:${row.file.id}:${index}`}
                    type="button"
                    onClick={() => openParent(row)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {row.file.mimeType === "application/vnd.google-apps.folder" ? (
                        <Folder className="size-4" />
                      ) : (
                        <File className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{row.file.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {availableDrives.find((d) => d.id === row.driveId)?.email ?? "Drive"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              {error && (
                <p role="alert" className="shrink-0 px-4 pb-2 text-xs text-destructive">
                  {error}
                </p>
              )}
              {hasNextPage && (
                <div className="shrink-0 border-t border-border bg-background/95 p-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    onClick={() => void search(true)}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" /> Loading…
                      </>
                    ) : (
                      "Load more results"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Search runs across the selected drives.
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                Close
              </Button>
              <Button
                type="submit"
                disabled={!query.trim() || loading || activeDriveIds.length === 0}
              >
                {loading && <LoaderCircle className="size-4 animate-spin" />}Search files
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
