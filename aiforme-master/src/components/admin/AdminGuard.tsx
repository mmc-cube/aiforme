'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from './AuthProvider';

interface AdminGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AdminGuard({ children, redirectTo = '/admin/login' }: AdminGuardProps) {
  const router = useRouter();
  const { user, loading } = useAdminAuth();

  useEffect(() => {
    // 如果正在加载，等待
    if (loading) {
      return;
    }

    // 如果用户未认证，重定向到登录页面
    if (!user) {
      console.log('🛡️ [Admin Guard] 用户未认证，重定向到登录页面');
      router.push(redirectTo);
      return;
    }

    console.log('✅ [Admin Guard] 用户已认证，允许访问');
  }, [user, loading, router, redirectTo]);

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">验证身份...</p>
        </div>
      </div>
    );
  }

  // 如果用户未认证，不渲染任何内容（等待重定向）
  if (!user) {
    return null;
  }

  // 用户已认证，渲染子组件
  return <>{children}</>;
}