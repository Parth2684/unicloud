"use client";

import { useEffect, useRef, useState } from "react";
import { FileIcon, Folder, MoreVertical } from "lucide-react";
import type { DriveFile } from "@/stores/cloud/types";
import { formatBytes, isFolder } from "@/utils/format";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileListProps = {
  items: DriveFile[];
  driveId: string;
  onOpenFolder: (item: DriveFile) => void;
};

export function FileList({ items, driveId, onOpenFolder }: FileListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col text-sm">
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <span>Name</span>
        <span className="text-right sm:pl-4 sm:text-left">Size</span>
        <span className="hidden text-right sm:block">Modified</span>
        <span className="sr-only">Actions</span>
      </div>
      <div className="flex-1 overflow-auto" role="list" aria-label="Files">
        {items.map((item) => (
          <FileRow
            key={item.id}
            driveId={driveId}
            item={item}
            onOpenFolder={onOpenFolder}
          />
        ))}
      </div>
    </div>
  );
}

type FileRowProps = {
  driveId: string;
  item: DriveFile;
  onOpenFolder: (item: DriveFile) => void;
};

function FileRow({ driveId, item, onOpenFolder }: FileRowProps) {
  const folder = isFolder(item.mimeType);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setClipboard, deleteFile } = useCloudStore();

  const sizeLabel = !folder && item.size != null ? formatBytes(item.size.toString()) : "—";
  const modifiedDate = item.modifiedTime || item.createdTime;
  const modifiedLabel = modifiedDate ? new Date(modifiedDate).toLocaleDateString() : "—";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      role="listitem"
      tabIndex={folder ? 0 : -1}
      onClick={() => {
        if (folder) onOpenFolder(item);
      }}
      onKeyDown={(e) => {
        if (folder && e.key === "Enter") onOpenFolder(item);
      }}
      className={cn(
        "relative grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 px-4 py-2 text-foreground transition-colors",
        "hover:bg-surface-hover",
        folder ? "cursor-pointer" : "cursor-default opacity-90",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 truncate">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            folder ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {folder ? <Folder className="size-3.5" /> : <FileIcon className="size-3.5" />}
        </div>
        <span className="truncate">{item.name}</span>
      </div>

      <div className="text-right text-xs text-muted-foreground sm:pl-4 sm:text-left">
        {sizeLabel}
      </div>
      <div className="hidden text-right text-xs text-muted-foreground sm:block">
        {modifiedLabel}
      </div>

      <div ref={menuRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${item.name}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <MoreVertical className="size-4" />
        </Button>

        {open && (
          <div
            role="menu"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full right-0 z-50 mt-1 w-36 overflow-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-soft"
          >
            <MenuItem
              onClick={() => {
                setClipboard(item.id, item.name, driveId, "copy");
                setOpen(false);
              }}
            >
              Copy
            </MenuItem>
            <MenuItem
              danger
              onClick={async () => {
                setOpen(false);
                await deleteFile(driveId, item.id);
              }}
            >
              Delete
            </MenuItem>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
        danger && "text-destructive",
      )}
    >
      {children}
    </button>
  );
}
