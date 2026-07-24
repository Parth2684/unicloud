export type PathSegment = {
  id: string;
  name: string;
};

export type DriveLocation = {
  driveId: string;
  folderId?: string;
  path: PathSegment[];
};

export type FavoriteFolder = {
  driveId: string;
  folderId: string;
  name: string;
  path: PathSegment[];
};

export type RecentLocation = DriveLocation & {
  visitedAt: number;
  label: string;
};

export type TreeNodeCache = {
  children: { id: string; name: string }[];
  loadedAt: number;
};

export function locationKey(driveId: string, folderId?: string): string {
  return `${driveId}:${folderId ?? "root"}`;
}

export function driveHref(driveId: string, folderId?: string): string {
  return folderId ? `/drive/${driveId}/${folderId}` : `/drive/${driveId}`;
}

export function rootPath(driveName = "My Drive"): PathSegment[] {
  return [{ id: "root", name: driveName }];
}
