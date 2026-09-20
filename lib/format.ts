const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function bn(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${bn(mins)} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${bn(hours)} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${bn(days)} দিন আগে`;
  try {
    return new Date(ts).toLocaleDateString("bn-BD");
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

export function fmtBytes(bytes: number): string {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function shortModel(name: string): string {
  if (!name) return "মডেল বাছাই হয়নি";
  return String(name).replace(/^models\//, "");
}
