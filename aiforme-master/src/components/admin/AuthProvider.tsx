'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AdminUser {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  refreshAuth: () => Promise<void>; // 新增：手动刷新认证状态
}

const AdminAuthContext = createContext<AuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false); // 防止重复检查

  // 检查登录状态
  useEffect(() => {
    checkAuthStatus();
    
    // 添加Edge浏览器特定的初始化
    const initEdgeCompatibility = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isEdge = userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg/') > -1;
      
      if (isEdge) {
        console.log('🌐 [Admin Auth] 检测到Edge浏览器，应用兼容性优化');
        // 确保Cookie设置正确
        if (!navigator.cookieEnabled) {
          console.warn('⚠️ [Admin Auth] Edge浏览器Cookie被禁用，认证功能可能无法正常工作');
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      initEdgeCompatibility();
    }
  }, []);

  const checkAuthStatus = async () => {
    // 防止重复检查
    if (isCheckingAuth) {
      console.log('⚠️ [Admin Auth] 认证检查已在进行中，跳过重复检查');
      return;
    }

    setIsCheckingAuth(true);

    try {
      console.log('🔍 [Admin Auth] 开始检查认证状态...');

      // 检测浏览器类型
      const userAgent = navigator.userAgent.toLowerCase();
      const isEdge = userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg/') > -1;
      console.log('🌐 [Admin Auth] 浏览器检测:', {
        userAgent: userAgent.substring(0, 100),
        isEdge,
        cookiesEnabled: navigator.cookieEnabled
      });

      const response = await fetch('/api/admin/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          // Edge浏览器特定的头
          ...(isEdge && { 'Sec-Fetch-Site': 'same-origin' })
        }
      });
      
      console.log('🔍 [Admin Auth] 认证检查响应:', {
        status: response.status,
        url: response.url,
        ok: response.ok
      });
      
      const data = await response.json();
      
      console.log('🔍 [Admin Auth] 认证检查结果:', {
        success: data.success,
        error: data.error,
        debug: data.debug,
        user: data.user
      });
      
      if (data.success) {
        console.log('✅ [Admin Auth] 认证成功，设置用户状态:', data.user);
        setUser(data.user);
      } else {
        console.warn('❌ [Admin Auth] 认证失败:', data.error, '调试信息:', data.debug);
        setUser(null);
      }
    } catch (error) {
      console.error('💥 [Admin Auth] 认证检查异常:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
      console.log('🏁 [Admin Auth] 认证检查完成，loading状态设置为false');
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 [Admin Auth] 开始登录流程:', { username });
      
      // 检测浏览器类型
      const userAgent = navigator.userAgent.toLowerCase();
      const isEdge = userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg/') > -1;
      
      console.log('🌐 [Admin Auth] 登录浏览器检测:', { 
        userAgent: userAgent.substring(0, 100),
        isEdge 
      });
      
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          // Edge浏览器特定的头
          ...(isEdge && { 'Sec-Fetch-Site': 'same-origin' })
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      console.log('🔐 [Admin Auth] 登录响应:', {
        status: response.status,
        url: response.url,
        ok: response.ok
      });

      const data = await response.json();
      
      console.log('🔐 [Admin Auth] 登录结果:', {
        success: data.success,
        error: data.error,
        user: data.user
      });

      if (data.success) {
        console.log('✅ [Admin Auth] 登录成功，设置用户状态:', data.user);
        setUser(data.user);
      }

      return { success: data.success, error: data.error };
    } catch (error) {
      console.error('💥 [Admin Auth] 登录异常:', error);
      return { success: false, error: '网络连接失败，请检查网络后重试' };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [Admin Auth] 开始登出流程...');
      
      // 检测浏览器类型
      const userAgent = navigator.userAgent.toLowerCase();
      const isEdge = userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg/') > -1;
      
      const response = await fetch('/api/admin/auth/logout', { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          // Edge浏览器特定的头
          ...(isEdge && { 'Sec-Fetch-Site': 'same-origin' })
        }
      });
      
      console.log('🚪 [Admin Auth] 登出响应:', {
        status: response.status,
        ok: response.ok,
        isEdge
      });
      
      setUser(null);
      console.log('✅ [Admin Auth] 登出完成，用户状态已清除');
      
      // Edge浏览器特定的Cookie清理
      if (isEdge) {
        console.log('🧹 [Admin Auth] Edge浏览器特定Cookie清理...');
        // 强制清除所有可能的认证Cookie
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name.toLowerCase().includes('admin_token') || 
              name.toLowerCase().includes('auth') || 
              name.toLowerCase().includes('token')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
    } catch (error) {
      console.error('💥 [Admin Auth] 登出异常:', error);
      setUser(null); // 即使API调用失败，也要清除本地状态
    }
  };

  // 手动刷新认证状态的函数
  const refreshAuth = async () => {
    console.log('🔄 [Admin Auth] 手动刷新认证状态');
    setLoading(true);
    await checkAuthStatus();
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout, checkAuthStatus, refreshAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// 为了向后兼容，保留useAuth别名
export { useAdminAuth as useAuth };