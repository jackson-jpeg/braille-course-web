'use client';

interface Stats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

interface Props {
  stats: Stats;
  activeFilter?: string;
  onFilterByStatus?: (status: string) => void;
}

function pct(num: number, denom: number): number {
  return denom > 0 ? Math.round((num / denom) * 100) : 0;
}

function rateClass(rate: number): string {
  if (rate >= 70) return 'email-stat-good';
  if (rate >= 40) return 'email-stat-moderate';
  return 'email-stat-poor';
}

export default function EmailDeliveryStats({ stats, activeFilter, onFilterByStatus }: Props) {
  const { sent, delivered, opened, clicked } = stats;
  const deliveryRate = pct(delivered, sent);
  const openRate = pct(opened, delivered);
  const clickRate = pct(clicked, opened);

  const cards = [
    { label: 'Sent', value: sent, rate: null as number | null, filter: 'all' },
    { label: 'Delivered', value: delivered, rate: deliveryRate, filter: 'delivered' },
    { label: 'Opened', value: opened, rate: openRate, filter: 'opened' },
    { label: 'Clicked', value: clicked, rate: clickRate, filter: 'clicked' },
  ];

  // Funnel widths (relative to sent)
  const funnelData = [
    { label: 'Sent', value: sent, width: 100 },
    { label: 'Delivered', value: delivered, width: pct(delivered, sent) || (sent === 0 ? 0 : 1) },
    { label: 'Opened', value: opened, width: pct(opened, sent) || (opened > 0 ? 1 : 0) },
    { label: 'Clicked', value: clicked, width: pct(clicked, sent) || (clicked > 0 ? 1 : 0) },
  ];

  return (
    <div className="email-delivery-stats">
      <div className="email-delivery-stats-cards">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            className={`email-delivery-stat-card${card.rate !== null ? ` ${rateClass(card.rate)}` : ''}${activeFilter === card.filter ? ' email-delivery-stat-card-active' : ''}`}
            onClick={() => onFilterByStatus?.(card.filter)}
          >
            <span className="email-delivery-stat-value">{card.value.toLocaleString()}</span>
            <span className="email-delivery-stat-label">{card.label}</span>
            {card.rate !== null && <span className="email-delivery-stat-rate">{card.rate}%</span>}
          </button>
        ))}
      </div>

      {/* Funnel visualization */}
      {sent > 0 && (
        <div className="email-delivery-funnel">
          {funnelData.map((item, i) => (
            <div key={item.label} className="email-delivery-funnel-row">
              <span className="email-delivery-funnel-label">{item.label}</span>
              <div className="email-delivery-funnel-track">
                <div
                  className={`email-delivery-funnel-bar email-delivery-funnel-bar-${i}`}
                  style={{ width: `${Math.max(item.width, 2)}%` }}
                  title={`${item.value.toLocaleString()} (${item.width}%)`}
                />
              </div>
              <span className="email-delivery-funnel-value">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
