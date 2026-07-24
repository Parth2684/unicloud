"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { locationKey, rootPath } from "@/stores/navigation/types";
import { isFolder } from "@/utils/format";
import { Spinner } from "@/components/ui/spinner";
import { FileList } from "@/components/drive/FileList";
import type { DriveFile } from "@/stores/cloud/types";

type DriveExplorerProps = {
  drive_id: string;
  folder_id?: string;
};

export function DriveExplorer({ drive_id, folder_id }: DriveExplorerProps) {
  const router = useRouter();
  const { setCurrentGoogleFolder, drive, loading } = useCloudStore();
  const {
    setLocation,
    getCachedPath,
    folderFilter,
    path,
    navigateTo,
    setTreeChildren,
  } = useNavigationStore();

  useEffect(() => {
    setCurrentGoogleFolder(drive_id, folder_id);
  }, [drive_id, folder_id, setCurrentGoogleFolder]);

  useEffect(() => {
    if (!Array.isArray(drive)) return;
    const key = locationKey(drive_id, folder_id);
    setTreeChildren(
      key,
      drive.filter((f) => isFolder(f.mimeType)).map((f) => ({ id: f.id, name: f.name })),
    );
  }, [drive, drive_id, folder_id, setTreeChildren]);

  useEffect(() => {
    const state = useNavigationStore.getState();
    const alreadyHere =
      state.driveId === drive_id && state.folderId === folder_id && state.path.length > 0;

    if (alreadyHere) {
      // Location was set by navigateTo / sidebar / breadcrumbs — avoid clobbering names.
      setLocation(
        { driveId: drive_id, folderId: folder_id, path: state.path },
        { pushHistory: false },
      );
      return;
    }

    const cached = getCachedPath(drive_id, folder_id);
    const nextPath =
      cached ??
      (folder_id
        ? [...rootPath(), { id: folder_id, name: "Current folder" }]
        : rootPath());

    setLocation(
      { driveId: drive_id, folderId: folder_id, path: nextPath },
      { pushHistory: true },
    );
  }, [drive_id, folder_id, getCachedPath, setLocation]);

  const filtered = useMemo(() => {
    const items = Array.isArray(drive) ? drive : [];
    const q = folderFilter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [drive, folderFilter]);

  const openFolder = (item: DriveFile) => {
    const href = navigateTo({
      driveId: drive_id,
      folderId: item.id,
      path: [...path, { id: item.id, name: item.name }],
    });
    router.push(href);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        {loading ? (
          <div className="flex flex-1 items-center justify-center" role="status" aria-live="polite">
            <Spinner />
          </div>
        ) : filtered.length > 0 ? (
          <FileList items={filtered} driveId={drive_id} onOpenFolder={openFolder} />
        ) : (
          <EmptyFolder hasFilter={!!folderFilter.trim()} />
        )}
      </div>
      {!loading && Array.isArray(drive) && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} item{filtered.length === 1 ? "" : "s"}
          {folderFilter.trim() ? " matching filter" : ""}
          {" · "}
          {drive.filter((f) => isFolder(f.mimeType)).length} folders
        </p>
      )}
    </div>
  );
}

function EmptyFolder({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FolderOpen className="size-7" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {hasFilter ? "No matching files" : "This folder is empty"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {hasFilter
            ? "Try a different search term."
            : "Files and folders you add will appear here."}
        </p>
      </div>
    </div>
  );
}
