"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { useNavigationStore } from "@/stores/navigation/useNavigationStore";
import { Spinner } from "@/components/ui/spinner";
import type { SharedDrive } from "@/stores/cloud/types";
import { rootPath } from "@/stores/navigation/types";

type GoogleComponentProps = {
  drive_id: string;
};

export const GoogleComponent = ({ drive_id }: GoogleComponentProps) => {
  const router = useRouter();
  const { sharedDrives, setSharedDrives, loading } = useCloudStore();
  const navigateTo = useNavigationStore((s) => s.navigateTo);
  const getLastLocation = useNavigationStore((s) => s.getLastLocation);

  useEffect(() => {
    setSharedDrives(drive_id);
  }, [drive_id, setSharedDrives]);

  const openMyDrive = () => {
    const last = getLastLocation(drive_id);
    const href = navigateTo(last ?? { driveId: drive_id, path: rootPath() });
    router.push(href);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Google Drive</h1>
        <p className="text-sm text-muted-foreground">
          Open your personal drive or one of the shared drives linked to this Google account.
        </p>
      </header>

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              My Drive
            </h2>
            <button
              type="button"
              onClick={openMyDrive}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <span className="text-sm font-semibold">G</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">My Drive</span>
                  <span className="text-xs text-muted-foreground">Personal files</span>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">Open</span>
            </button>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Shared drives
            </h2>

            {Array.isArray(sharedDrives) && sharedDrives.length > 0 ? (
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
                {sharedDrives.map((drive) => (
                  <SharedDriveRow key={drive.id} drive={drive} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                No shared drives were found for this account.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

function SharedDriveRow({ drive }: { drive: SharedDrive }) {
  const router = useRouter();
  const navigateTo = useNavigationStore((s) => s.navigateTo);
  const getLastLocation = useNavigationStore((s) => s.getLastLocation);

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-surface-hover"
      onClick={() => {
        const last = getLastLocation(drive.id);
        const href = navigateTo(
          last ?? { driveId: drive.id, path: rootPath(drive.name) },
        );
        router.push(href);
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-success/15 text-success">
          <span className="text-sm font-semibold">S</span>
        </div>
        <span className="truncate text-sm font-medium text-foreground">{drive.name}</span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">Open</span>
    </button>
  );
}
