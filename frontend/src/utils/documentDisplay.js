// Maps the backend's DocumentStatus enum (AVAILABLE / CHECKED_OUT / MISSING) to display metadata.
export const STATUS_META = {
  AVAILABLE: {
    label: 'Available',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300',
  },
  CHECKED_OUT: {
    label: 'Checked Out',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300',
  },
  MISSING: {
    label: 'Missing',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300',
  },
};

export const STATUS_FILTER_OPTIONS = ['All', 'AVAILABLE', 'CHECKED_OUT', 'MISSING'];

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.AVAILABLE;
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
