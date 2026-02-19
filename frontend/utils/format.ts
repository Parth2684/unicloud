export const formatBytes = (storage: string | number): string => {
  const bytes = typeof storage === "number" ? storage : Number(storage);

  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(value >= 10 ? 0 : 2)} ${sizes[i]}`;
};

export const formatDuration = (time: string | number): string => {
  const ms = typeof time === "number" ? time : Number(time);

  if (!Number.isFinite(ms) || ms <= 0) return "0 ms";

  const k = 1000;
  const sizes = ["ms", "s", "min", "hr", "day"];

  const steps = [
    1,
    k,
    k * 60,
    k * 60 * 60,
    k * 60 * 60 * 24
  ];

  let i = steps.length - 1;

  for (; i > 0; i--) {
    if (ms >= steps[i]) break;
  }

  const value = ms / steps[i];

  return `${value.toFixed(value >= 10 ? 0 : 2)} ${sizes[i]}`;
};

export const getUsagePercentage = (
  usage: string | number,
  limit: string | number | null,
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
