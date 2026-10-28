"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useNavigationStore.getState().setCommandOpen(true);
        return;
      }

      if (e.key === "Escape") {
        const nav = useNavigationStore.getState();
        if (nav.commandOpen) {
          nav.setCommandOpen(false);
          return;
        }
        if (nav.sidebarOpen) {
          nav.setSidebarOpen(false);
          return;
        }
        if (nav.folderFilter) {
          nav.setFolderFilter("");
        }
        return;
      }

      if (typing) return;

      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        const href = useNavigationStore.getState().goBack();
        if (href) router.push(href);
        return;
      }

      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        const href = useNavigationStore.getState().goForward();
        if (href) router.push(href);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);
}
