import AdminLayout from '@/components/admin/AdminLayout';
import { AdminAuthProvider } from '@/components/admin/AuthProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthProvider>
  );
}