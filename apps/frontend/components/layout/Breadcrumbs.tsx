"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";

export function DriveBreadcrumbs({ onNavigate }: { onNavigate: (href: string) => void }) {
  const path = useNavigationStore((s) => s.path);
  const jumpToBreadcrumb = useNavigationStore((s) => s.jumpToBreadcrumb);
  const driveId = useNavigationStore((s) => s.driveId);

  if (!driveId) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/home" className="hover:text-foreground">
          Home
        </Link>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
      <ol className="flex min-w-0 items-center gap-1">
        {path.map((segment, index) => {
          const isLast = index === path.length - 1;
          return (
            <li key={`${segment.id}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 && (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              {isLast ? (
                <span className="truncate font-medium text-foreground" aria-current="page">
                  {segment.name}
                </span>
              ) : (
                <button
                  type="button"
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    const href = jumpToBreadcrumb(index);
                    if (href) onNavigate(href);
                  }}
                >
                  {segment.name}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
