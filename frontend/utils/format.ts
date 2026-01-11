export const formatBytes = (storage: string | number): string => {
  const bytes =
    typeof storage === "number"
      ? storage
      : Number(storage);

  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(value >= 10 ? 0 : 2)} ${sizes[i]}`;
};


export const getUsagePercentage = (
  usage: string | number,
  limit: string | number | null
): number => {
  if (limit == null) return 0;

  const used = Number(usage);
  const max = Number(limit);

  if (!Number.isFinite(used) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.min((used / max) * 100, 100);
};


export const isFolder = (mimeType: string): boolean => {
  return mimeType === "application/vnd.google-apps.folder";
};
