'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/components/admin/AuthProvider';

export default function AdminDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, login, loading: authLoading } = useAdminAuth();

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/debug');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('获取调试信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      const result = await login('admin', 'admin123');
      console.log('测试登录结果:', result);
      alert(result.success ? '登录成功！' : `登录失败: ${result.error}`);
    } catch (error) {
      console.error('测试登录失败:', error);
      alert('登录失败: ' + error);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const checkCookies = () => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    console.log('浏览器Cookies:', cookies);
    alert(`检查控制台查看Cookie信息`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">管理员认证调试页面</h1>

        {/* 认证状态 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">认证状态</h2>
          <div className="space-y-2">
            <p><strong>加载状态:</strong> {authLoading ? '加载中...' : '已加载'}</p>
            <p><strong>用户状态:</strong> {user ? `已登录 (${user.username})` : '未登录'}</p>
          </div>
        </div>

        {/* 调试工具 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">调试工具</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={fetchDebugInfo}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '加载中...' : '获取调试信息'}
            </button>
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              测试登录
            </button>
            <button
              onClick={checkCookies}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              检查浏览器Cookie
            </button>
          </div>
        </div>

        {/* 调试信息 */}
        {debugInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">调试信息</h2>
            <div className="bg-gray-100 p-4 rounded overflow-x-auto">
              <pre className="text-sm">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 手动测试说明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-2">手动测试步骤</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>打开浏览器开发者工具 (F12)</li>
            <li>切换到 Network 标签页</li>
            <li>点击"测试登录"按钮</li>
            <li>观察登录请求的响应</li>
            <li>检查是否设置了 admin_token cookie</li>
            <li>点击"获取调试信息"查看当前状态</li>
            <li>检查 Application 标签页中的 Cookie</li>
          </ol>
        </div>
      </div>
    </div>
  );
}