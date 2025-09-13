'use client';

import { useState, useEffect } from 'react';
import { EdgeCompat, EdgeAuthAPI } from '@/lib/edge-compat';

export default function AuthTestPage() {
  const [status, setStatus] = useState('正在初始化...');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [cookieInfo, setCookieInfo] = useState<any>(null);
  const [browserInfo, setBrowserInfo] = useState<any>(null);

  const addTestResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setStatus('正在运行测试...');
    
    // 浏览器兼容性测试
    addTestResult('浏览器检测', {
      isEdge: EdgeCompat.isEdgeBrowser(),
      isDevelopment: EdgeCompat.isDevelopment()
    });

    // Cookie支持测试
    const cookieSupport = await EdgeCompat.testCookieSupport();
    addTestResult('Cookie支持', cookieSupport);

    // 认证状态测试
    try {
      const authResponse = await EdgeAuthAPI.verify();
      const authData = await authResponse.json();
      addTestResult('认证验证', {
        status: authResponse.status,
        data: authData
      });
    } catch (error) {
      addTestResult('认证验证', { error: error instanceof Error ? error.message : '未知错误' });
    }

    // 获取调试信息
    const debugInfo = EdgeCompat.getEdgeDebugInfo();
    setBrowserInfo(debugInfo);
    addTestResult('浏览器调试信息', debugInfo);

    // Cookie信息
    if (typeof document !== 'undefined') {
      setCookieInfo({
        allCookies: document.cookie,
        adminToken: document.cookie.includes('admin_token')
      });
    }

    setStatus('测试完成');
  };

  useEffect(() => {
    runTests();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await EdgeAuthAPI.login({
        username: 'admin',
        password: 'nimiai'
      });
      const result = await response.json();
      addTestResult('登录测试', result);
      
      // 重新运行认证测试
      setTimeout(runTests, 1000);
    } catch (error) {
      addTestResult('登录测试', { error: error instanceof Error ? error.message : '未知错误' });
    }
  };

  const handleLogout = async () => {
    try {
      const response = await EdgeAuthAPI.logout();
      const result = await response.json();
      addTestResult('登出测试', result);
      
      // 重新运行认证测试
      setTimeout(runTests, 1000);
    } catch (error) {
      addTestResult('登出测试', { error: error instanceof Error ? error.message : '未知错误' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">认证系统测试页面</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 状态卡片 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">系统状态</h2>
            <div className="space-y-2">
              <p><strong>状态:</strong> {status}</p>
              <p><strong>Edge浏览器:</strong> {EdgeCompat.isEdgeBrowser() ? '是' : '否'}</p>
              <p><strong>开发环境:</strong> {EdgeCompat.isDevelopment() ? '是' : '否'}</p>
              {browserInfo && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">浏览器信息:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(browserInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Cookie信息卡片 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cookie信息</h2>
            {cookieInfo ? (
              <div className="space-y-2">
                <p><strong>包含admin_token:</strong> {cookieInfo.adminToken ? '是' : '否'}</p>
                <div>
                  <h3 className="font-medium mb-2">所有Cookie:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {cookieInfo.allCookies || '无Cookie'}
                  </pre>
                </div>
              </div>
            ) : (
              <p>正在获取Cookie信息...</p>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={runTests}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重新运行测试
          </button>
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            测试登录 (admin/nimiai)
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            测试登出
          </button>
        </div>

        {/* 测试结果 */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{result.test}</h3>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}