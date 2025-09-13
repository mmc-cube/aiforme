import { AdminAuthProvider } from '@/components/admin/AuthProvider';

// 管理员登录页面使用独立的AuthProvider，避免与根布局的普通用户AuthProvider冲突
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}