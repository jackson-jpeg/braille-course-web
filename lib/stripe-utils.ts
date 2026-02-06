export function translateInvoiceStatus(status: string | null, dueDate: number | null): string {
  if (!status) return 'Unknown';
  switch (status) {
    case 'draft':
      if (dueDate) {
        const d = new Date(dueDate * 1000);
        return `Scheduled for ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
      return 'Draft';
    case 'open':
      if (dueDate && dueDate * 1000 < Date.now()) return 'Payment Due (Overdue)';
      if (dueDate && dueDate * 1000 > Date.now()) {
        return `Due ${new Date(dueDate * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
      return 'Payment Due';
    case 'paid':
      return 'Paid';
    case 'void':
      return 'Voided';
    case 'uncollectible':
      return 'Uncollectible';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
