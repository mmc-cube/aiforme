'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/components/admin/AuthProvider';
import { log } from '@/lib/unified-logger';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const auth = useAdminAuth();

  const navigation = [
    { name: '仪表板', href: '/admin', icon: '📊' },
    { name: '文章管理', href: '/admin/posts', icon: '📝' },
    { name: '文章排序', href: '/admin/posts/order', icon: '📋' },
    { name: '访问统计', href: '/admin/analytics', icon: '📈' },
    { name: '标签管理', href: '/admin/tags', icon: '🏷️' },
    { name: '认证诊断', href: '/admin/debug', icon: '🔍', adminOnly: true },
    { name: '设置', href: '/admin/settings', icon: '⚙️' },
  ];

  // 如果是登录页面，直接显示内容，不应用管理布局
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return <>{children}</>;
  }

  // 加载状态
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录状态
  if (!auth.user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先登录</p>
          <Link
            href="/admin/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 移动端导航栏 */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
          <div className="flex items-center">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="ml-2 text-lg font-medium text-gray-900">管理后台</h1>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-3">{auth.user?.username}</span>
            <button
              onClick={async () => {
                log.info('auth', 'User logout from admin layout');
                await auth.logout();
              }}
              className="text-gray-500 hover:text-gray-600 focus:outline-none"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-screen pt-16 lg:pt-0">
        {/* 侧边栏 */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:pt-0 pt-16`}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 px-4 bg-indigo-600 lg:bg-transparent">
              <h1 className="text-xl font-bold text-white lg:text-indigo-600">博客管理</h1>
            </div>

            {/* 导航菜单 */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* 用户信息 */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{auth.user?.username}</p>
                  <p className="text-xs text-gray-500">{auth.user?.role}</p>
                </div>
                <button
                  onClick={async () => {
                    log.info('auth', 'User logout from sidebar');
                    await auth.logout();
                  }}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  title="退出登录"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部栏 */}
          <header className="bg-white shadow-sm border-b border-gray-200 lg:block hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {navigation.find(item => item.href === pathname)?.name || '管理后台'}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">欢迎, {auth.user?.username}</span>
                <button
                  onClick={async () => {
                    log.info('auth', 'User logout from header');
                    await auth.logout();
                  }}
                  className="text-gray-500 hover:text-gray-600 focus:outline-none"
                >
                  退出登录
                </button>
              </div>
            </div>
          </header>

          {/* 页面内容 */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}