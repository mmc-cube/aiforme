import AdminLayoutComponent from '@/components/admin/AdminLayout';
import { AdminAuthProvider } from '@/components/admin/AuthProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutComponent>{children}</AdminLayoutComponent>
    </AdminAuthProvider>
  );
}