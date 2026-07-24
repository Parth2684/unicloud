"use client";

import { DriveExplorer } from "@/components/drive/DriveExplorer";

type DriveComponentProps = {
  drive_id: string;
  folder_id?: string;
};

/** @deprecated Prefer DriveExplorer — kept as thin re-export for route compatibility */
export const DriveComponent = ({ drive_id, folder_id }: DriveComponentProps) => {
  return <DriveExplorer drive_id={drive_id} folder_id={folder_id} />;
};
