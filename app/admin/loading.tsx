import { SkeletonCards, SkeletonTable } from '@/components/admin/AdminSkeleton';

export default function AdminLoading() {
  return (
    <div className="admin-page">
      <div className="admin-dashboard">
        {/* Header skeleton */}
        <div className="admin-dashboard-header">
          <div className="admin-dashboard-greeting">
            <div className="admin-skeleton-line admin-skeleton-lg" style={{ width: 200 }} />
          </div>
          <div className="admin-dashboard-actions">
            <div className="admin-skeleton-line admin-skeleton-sm" style={{ width: 120, height: 32 }} />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="admin-tabs">
          <div className="admin-tabs-inner">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="admin-tab admin-tab-skeleton">
                <div className="admin-skeleton-line admin-skeleton-sm" style={{ width: 80 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Content area skeleton */}
        <div className="admin-content">
          <div className="admin-content-inner">
            <SkeletonCards count={4} />
            <div style={{ marginTop: 32 }}>
              <SkeletonTable rows={6} cols={5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
