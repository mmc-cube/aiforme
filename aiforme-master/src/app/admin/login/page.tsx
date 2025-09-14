'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/components/admin/AuthProvider';

// 动态导入清理工具（仅在客户端加载）
const loadAuthCleanup = async () => {
  if (typeof window !== 'undefined') {
    const authModule = await import('@/lib/auth-cleanup');
    return authModule.authCleanup;
  }
  return null;
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authCleanupLoaded, setAuthCleanupLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();
  const { login } = useAdminAuth();

  // 加载清理工具
  useEffect(() => {
    loadAuthCleanup().then(() => setAuthCleanupLoaded(true));
  }, []);

  // 清理认证状态
  const handleCleanupAuth = async () => {
    try {
      const cleanupTool = await loadAuthCleanup();
      if (cleanupTool) {
        setDebugInfo('开始清理认证状态...');
        console.log('🔍 当前认证状态检查...');
        
        // 显示当前存储状态
        const cookies = document.cookie.split(';').filter(c => c.trim().startsWith('admin_token'));
        const localStorageKeys = Object.keys(localStorage).filter(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('auth'));
        const sessionStorageKeys = Object.keys(sessionStorage).filter(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('auth'));
        
        console.log('🍪 Cookies:', cookies);
        console.log('💾 localStorage keys:', localStorageKeys);
        console.log('💾 sessionStorage keys:', sessionStorageKeys);
        
        // 执行清理
        const result = await cleanupTool.cleanup();
        
        setDebugInfo(`清理完成！\\n清除项目: ${result.clearedItems.length}\\n错误: ${result.errors.length}\\n请刷新页面后重新登录`);
      }
    } catch (error) {
      console.error('清理失败:', error);
      setDebugInfo(`清理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 检查认证状态
  const handleCheckAuthState = async () => {
    try {
      setDebugInfo('检查认证状态...');
      
      // 检查各种存储
      const cookies = document.cookie.split(';').filter(c => c.trim().startsWith('admin_token'));
      const localStorageKeys = Object.keys(localStorage).filter(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('auth'));
      const sessionStorageKeys = Object.keys(sessionStorage).filter(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('auth'));
      
      console.log('🔍 认证状态检查结果:');
      console.log('🍪 Cookies:', cookies);
      console.log('💾 localStorage keys:', localStorageKeys);
      console.log('💾 sessionStorage keys:', sessionStorageKeys);
      
      const hasAuthData = cookies.length > 0 || localStorageKeys.length > 0 || sessionStorageKeys.length > 0;
      setDebugInfo(`当前状态: ${hasAuthData ? '❌ 有认证数据' : '✅ 干净'}\\nCookies: ${cookies.length}\\nlocalStorage: ${localStorageKeys.length}\\nsessionStorage: ${sessionStorageKeys.length}\\n请查看控制台详细信息`);
    } catch (error) {
      console.error('检查失败:', error);
      setDebugInfo(`检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('尝试登录:', { username, password });

    try {
      const result = await login(username, password);
      console.log('登录结果:', result);

      if (result.success) {
        // 登录成功，跳转到管理后台
        console.log('登录成功，准备跳转');
        router.push('/admin');
      } else {
        setError(result.error || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理员登录
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请登录以管理博客内容
          </p>
          <p className="mt-1 text-center text-xs text-blue-600">
            正确访问地址: /admin/login (不带末尾斜杠)
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>默认账号：admin / admin123</p>
            <p className="mt-2 text-xs text-gray-500">
              登录后请立即修改默认密码
            </p>
          </div>

          {/* 认证状态调试工具 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-3">
                🔧 认证调试工具
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCheckAuthState}
                  disabled={!authCleanupLoaded}
                  className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  检查认证状态
                </button>
                
                <button
                  type="button"
                  onClick={handleCleanupAuth}
                  disabled={!authCleanupLoaded}
                  className="inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清理认证状态
                </button>
              </div>
              
              {/* 调试信息显示 */}
              {debugInfo && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 whitespace-pre-line">
                    {debugInfo}
                  </p>
                </div>
              )}
              
              <p className="mt-2 text-xs text-gray-400">
                💡 清理后请刷新页面重新登录，详细信息请查看控制台
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}