const timeFormat = new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** Chat bubble timestamp: just the time for today, date + time otherwise. */
export function formatMessageTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  return date.toDateString() === now.toDateString() ? timeFormat.format(date) : dateTimeFormat.format(date);
}

/** Compact "how long ago" for inbox rows. */
export function formatRelativeTime(iso: string, now = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short" }).format(new Date(iso));
}
