"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Folder, Loader2 } from "lucide-react";
import { fetchFolderChildren } from "@/api/cloud";
import { isFolder } from "@/utils/format";
import { locationKey, rootPath, type PathSegment } from "@/stores/navigation/types";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { cn } from "@/lib/utils";

type FolderTreeProps = {
  driveId: string;
  driveName?: string;
};

export function FolderTree({ driveId, driveName = "My Drive" }: FolderTreeProps) {
  const router = useRouter();
  const currentFolderId = useNavigationStore((s) => s.folderId);
  const currentDriveId = useNavigationStore((s) => s.driveId);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentFolderId, currentDriveId]);

  return (
    <div className="space-y-0.5" role="tree" aria-label="Folder tree">
      <FolderTreeNode
        driveId={driveId}
        folderId={undefined}
        name={driveName}
        depth={0}
        path={rootPath(driveName)}
        selectedRef={
          currentDriveId === driveId && !currentFolderId ? selectedRef : undefined
        }
        onNavigate={(href) => router.push(href)}
      />
    </div>
  );
}

type NodeProps = {
  driveId: string;
  folderId?: string;
  name: string;
  depth: number;
  path: PathSegment[];
  selectedRef?: React.RefObject<HTMLButtonElement | null>;
  onNavigate: (href: string) => void;
};

function FolderTreeNode({
  driveId,
  folderId,
  name,
  depth,
  path,
  selectedRef,
  onNavigate,
}: NodeProps) {
  const key = locationKey(driveId, folderId);
  const expanded = useNavigationStore((s) => !!s.expanded[key]);
  const toggleExpanded = useNavigationStore((s) => s.toggleExpanded);
  const setExpanded = useNavigationStore((s) => s.setExpanded);
  const getTreeChildren = useNavigationStore((s) => s.getTreeChildren);
  const setTreeChildren = useNavigationStore((s) => s.setTreeChildren);
  const navigateTo = useNavigationStore((s) => s.navigateTo);
  const currentDriveId = useNavigationStore((s) => s.driveId);
  const currentFolderId = useNavigationStore((s) => s.folderId);

  const [loading, setLoading] = useState(false);
  const children = getTreeChildren(key);
  const selected =
    currentDriveId === driveId && (currentFolderId ?? undefined) === folderId;

  useEffect(() => {
    if (!expanded || children) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const files = await fetchFolderChildren(driveId, folderId);
        if (cancelled) return;
        const folders = files
          .filter((f) => isFolder(f.mimeType))
          .map((f) => ({ id: f.id, name: f.name }));
        setTreeChildren(key, folders);
      } catch {
        if (!cancelled) setTreeChildren(key, []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded, children, driveId, folderId, key, setTreeChildren]);

  // Auto-expand ancestors when the current location is under this node
  const navPathIds = useNavigationStore((s) => s.path.map((p) => p.id).join("/"));
  const nodePathIds = path.map((p) => p.id).join("/");
  useEffect(() => {
    if (expanded) return;
    if (currentDriveId !== driveId) return;
    const navIds = navPathIds ? navPathIds.split("/") : [];
    const nodeIds = nodePathIds ? nodePathIds.split("/") : [];
    const onPath = nodeIds.every((id, i) => navIds[i] === id);
    if (onPath && nodeIds.length < navIds.length) {
      setExpanded(key, true);
    }
  }, [expanded, currentDriveId, driveId, key, navPathIds, nodePathIds, setExpanded]);

  return (
    <div role="treeitem" aria-expanded={expanded} aria-selected={selected}>
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-md pr-1 text-sm transition-colors",
          selected
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/70",
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={expanded ? `Collapse ${name}` : `Expand ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded(key);
          }}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : expanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
        </button>
        <button
          ref={selectedRef}
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 truncate rounded px-1 py-1 text-left"
          onClick={() => {
            const href = navigateTo({ driveId, folderId, path });
            onNavigate(href);
          }}
          onDoubleClick={() => toggleExpanded(key)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              if (!expanded) toggleExpanded(key);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              if (expanded) toggleExpanded(key);
            } else if (e.key === "Enter") {
              e.preventDefault();
              const href = navigateTo({ driveId, folderId, path });
              onNavigate(href);
            }
          }}
        >
          <Folder className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{name}</span>
        </button>
      </div>

      {expanded && children && (
        <div role="group" className="animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {children.length === 0 ? (
            <p
              className="py-1 text-xs text-muted-foreground"
              style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
            >
              Empty
            </p>
          ) : (
            children.map((child) => (
              <FolderTreeNode
                key={child.id}
                driveId={driveId}
                folderId={child.id}
                name={child.name}
                depth={depth + 1}
                path={[...path, { id: child.id, name: child.name }]}
                onNavigate={onNavigate}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
