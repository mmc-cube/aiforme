import AdminLayoutWrapper from '@/components/admin/AdminLayout';
import { AuthProvider } from '@/components/admin/AuthProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </AuthProvider>
  );
}