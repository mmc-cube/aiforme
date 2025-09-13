'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/components/admin/AuthProvider';

export default function SimpleAdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();
  const { login } = useAdminAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo('开始登录...');

    try {
      setDebugInfo('调用登录API...');
      const result = await login(username, password);
      
      setDebugInfo(`登录结果: ${JSON.stringify(result)}`);
      
      if (result.success) {
        setDebugInfo('登录成功，准备跳转...');
        router.push('/admin');
      } else {
        setError(result.error || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      setDebugInfo(`登录异常: ${error}`);
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const checkDebug = () => {
    const info = {
      userAgent: navigator.userAgent,
      cookieEnabled: navigator.cookieEnabled,
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      cookies: document.cookie
    };
    setDebugInfo(`调试信息: ${JSON.stringify(info, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理员登录 (简化版)
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            用于测试认证系统
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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

          {debugInfo && (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded relative">
              <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
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
            <button
              type="button"
              onClick={checkDebug}
              className="mt-2 text-indigo-600 hover:text-indigo-800 underline"
            >
              调试信息
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}