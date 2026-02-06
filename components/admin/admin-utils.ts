/* ── Shared utilities for admin dashboard components ── */

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function fullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function downloadCsv(
  enrollments: { email: string | null; section: { label: string }; plan: string; paymentStatus: string; stripeCustomerId: string | null; createdAt: string }[],
  scheduleMap: Record<string, string>,
) {
  const headers = ['Email', 'Section', 'Schedule', 'Plan', 'Status', 'Stripe Customer', 'Date'];
  const rows = enrollments.map((e) => [
    e.email || '',
    e.section.label,
    scheduleMap[e.section.label] || e.section.label,
    e.plan,
    e.paymentStatus,
    e.stripeCustomerId || '',
    new Date(e.createdAt).toISOString(),
  ]);

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
