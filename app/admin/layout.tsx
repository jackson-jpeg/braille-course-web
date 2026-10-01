import '@/styles/legacy-admin.css';
import '@/styles/admin-theme.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <main id="main-content">{children}</main>;
}
