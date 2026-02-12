import { SkeletonCards } from '@/components/admin/AdminSkeleton';

export default function AdminLoading() {
  return (
    <div className="admin-wrap">
      <div className="admin-inner">
        <SkeletonCards count={4} />
      </div>
    </div>
  );
}
