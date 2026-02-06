'use client';

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="admin-skeleton-cards">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="admin-skeleton-card">
          <div className="admin-skeleton-line admin-skeleton-lg" />
          <div className="admin-skeleton-line admin-skeleton-sm" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="admin-skeleton-table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="admin-skeleton-row">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="admin-skeleton-cell">
              <div className="admin-skeleton-line" style={{ width: `${60 + Math.random() * 30}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="admin-skeleton-text">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="admin-skeleton-line"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}
