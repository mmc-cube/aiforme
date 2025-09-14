'use client';

import { EdgeCompat, EdgeAuthAPI } from './edge-compat';

// 认证状态类型定义
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    username: string;
    role: 'user' | 'admin';
    email?: string;
  } | null;
  token: string | null;
  lastSyncTime: number | null;
  syncStatus: 'synced' | 'syncing' | 'error';
  syncError: string | null;
}

// 认证事件类型
export type AuthEventType = 
  | 'login_start'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'token_refresh'
  | 'state_sync'
  | 'cookie_error'
  | 'storage_error'
  | 'browser_compat_check';

// 认证事件接口
export interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  data: any;
  source: string; // 'client' | 'server' | 'sync'
}

// 统一的认证服务类
export class UnifiedAuthService {
  private static instance: UnifiedAuthService;
  private state: AuthState;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private eventListeners: Set<(event: AuthEvent) => void> = new Set();
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.state = {
      isAuthenticated: false,
      isLoading: true,
      user: null,
      token: null,
      lastSyncTime: null,
      syncStatus: 'syncing',
      syncError: null
    };
  }

  static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService();
    }
    return UnifiedAuthService.instance;
  }

  // 初始化认证服务
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.emitEvent({
      type: 'browser_compat_check',
      timestamp: Date.now(),
      data: this.checkBrowserCompatibility(),
      source: 'client'
    });

    // 从所有存储位置加载认证状态
    await this.loadAuthState();
    
    // 启动状态同步
    this.startStateSync();
    
    // 监听存储变化
    this.setupStorageListeners();
    
    this.isInitialized = true;
    this.updateState({ isLoading: false });
  }

  // 检查浏览器兼容性（增强版）
  private checkBrowserCompatibility() {
    const basicCompat = {
      hasCookieSupport: typeof document !== 'undefined' && navigator.cookieEnabled,
      hasLocalStorage: typeof Storage !== 'undefined',
      hasSessionStorage: typeof sessionStorage !== 'undefined',
      hasFetch: typeof fetch !== 'undefined',
      hasAsyncStorage: typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function',
      isPrivateMode: false,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
    
    // 集成Edge兼容性检查
    const edgeCompat = EdgeCompat.isEdgeBrowser() ? {
      isEdgeBrowser: true,
      edgeSpecific: true,
      cookieTest: EdgeCompat.getEdgeCompatibleCookieOptions()
    } : {
      isEdgeBrowser: false,
      edgeSpecific: false
    };
    
    // 检测隐私模式
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      }
    } catch (e) {
      basicCompat.isPrivateMode = true;
    }

    return {
      ...basicCompat,
      ...edgeCompat
    };
  }

  // 从多个存储位置加载认证状态
  private async loadAuthState(): Promise<void> {
    try {
      // 检查 Cookie
      const cookieToken = this.getCookie('admin_token') || this.getCookie('auth_token');
      
      // 检查 localStorage
      const localToken = typeof localStorage !== 'undefined' ? localStorage.getItem('knowledge-blog-token') : null;
      
      // 检查 sessionStorage
      const sessionToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('knowledge-blog-token') : null;
      
      // 同步所有存储
      let finalToken = cookieToken || localToken || sessionToken;
      
      if (finalToken) {
        // 统一所有存储
        this.syncTokenAcrossStorages(finalToken);
        
        // 验证 token
        const isValid = await this.verifyToken(finalToken);
        
        if (isValid) {
          // 获取用户信息
          const userInfo = await this.getUserInfo(finalToken);
          this.updateState({
            isAuthenticated: true,
            token: finalToken,
            user: userInfo,
            lastSyncTime: Date.now(),
            syncStatus: 'synced',
            syncError: null
          });
        } else {
          this.clearAllAuthData();
        }
      } else {
        this.updateState({
          isAuthenticated: false,
          token: null,
          user: null,
          syncStatus: 'synced',
          syncError: null
        });
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.updateState({
        syncStatus: 'error',
        syncError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 同步 token 到所有存储位置
  private syncTokenAcrossStorages(token: string): void {
    // localStorage
    try {
      localStorage.setItem('knowledge-blog-token', token);
    } catch (e) {
      this.emitEvent({
        type: 'storage_error',
        timestamp: Date.now(),
        data: { storage: 'localStorage', error: e },
        source: 'client'
      });
    }

    // sessionStorage
    try {
      sessionStorage.setItem('knowledge-blog-token', token);
    } catch (e) {
      this.emitEvent({
        type: 'storage_error',
        timestamp: Date.now(),
        data: { storage: 'sessionStorage', error: e },
        source: 'client'
      });
    }
  }

  // 验证 token（Edge兼容）
  private async verifyToken(token: string): Promise<boolean> {
    try {
      console.log('🔍 验证Token...');
      const response = await EdgeAuthAPI.verify();
      const data = await response.json();
      console.log('🔍 Token验证结果:', data.success);
      return data.success;
    } catch (error) {
      console.error('❌ Token验证失败:', error);
      return false;
    }
  }

  // 获取用户信息
  private async getUserInfo(token: string): Promise<AuthState['user']> {
    try {
      // 从 token 解码获取基本信息
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id || 'unknown',
        username: payload.username || 'unknown',
        role: payload.role || 'user',
        email: payload.email
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  // 清除所有认证数据
  clearAllAuthData(): void {
    // 清除 Cookie
    this.deleteCookie('admin_token');
    this.deleteCookie('auth_token');
    
    // 清除 localStorage
    try {
      localStorage.removeItem('knowledge-blog-token');
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    
    // 清除 sessionStorage
    try {
      sessionStorage.removeItem('knowledge-blog-token');
    } catch (e) {
      console.error('Failed to clear sessionStorage:', e);
    }

    this.updateState({
      isAuthenticated: false,
      token: null,
      user: null
    });
  }

  // 登录
  async login(credentials: { username: string; password: string } | { code: string }): Promise<{ success: boolean; error?: string }> {
    this.emitEvent({
      type: 'login_start',
      timestamp: Date.now(),
      data: { type: 'username' in credentials ? 'admin' : 'user' },
      source: 'client'
    });

    this.updateState({ syncStatus: 'syncing' });

    try {
      let response;
      
      if ('username' in credentials) {
        // 管理员登录（Edge兼容）
        console.log('🔐 开始管理员登录...');
        response = await EdgeAuthAPI.login(credentials);
      } else {
        // 用户登录（邀请码）
        response = await fetch('/netlify/functions/verify-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: credentials.code })
        });
      }

      const data = await response.json();

      if (data.success) {
        // 提取 token
        const token = data.token || this.getCookie('admin_token');
        
        if (token) {
          this.syncTokenAcrossStorages(token);
          
          const userInfo = await this.getUserInfo(token);
          this.updateState({
            isAuthenticated: true,
            token,
            user: userInfo,
            lastSyncTime: Date.now(),
            syncStatus: 'synced',
            syncError: null
          });

          this.emitEvent({
            type: 'login_success',
            timestamp: Date.now(),
            data: { user: userInfo },
            source: 'client'
          });

          return { success: true };
        }
      }

      const error = data.error || '登录失败';
      this.updateState({
        syncStatus: 'error',
        syncError: error
      });

      this.emitEvent({
        type: 'login_failed',
        timestamp: Date.now(),
        data: { error },
        source: 'client'
      });

      return { success: false, error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误';
      this.updateState({
        syncStatus: 'error',
        syncError: errorMessage
      });

      this.emitEvent({
        type: 'login_failed',
        timestamp: Date.now(),
        data: { error: errorMessage },
        source: 'client'
      });

      return { success: false, error: errorMessage };
    }
  }

  // 登出（Edge兼容）
  async logout(): Promise<void> {
    try {
      console.log('🚪 开始登出...');
      // 调用后端登出
      await EdgeAuthAPI.logout();
    } catch (error) {
      console.error('❌ 登出API调用失败:', error);
    } finally {
      this.clearAllAuthData();
      
      this.emitEvent({
        type: 'logout',
        timestamp: Date.now(),
        data: {},
        source: 'client'
      });
    }
  }

  // 启动状态同步
  private startStateSync(): void {
    // 每 30 秒同步一次
    this.syncTimer = setInterval(async () => {
      if (this.state.isAuthenticated && this.state.token) {
        const isValid = await this.verifyToken(this.state.token!);
        
        if (!isValid) {
          this.clearAllAuthData();
        } else {
          this.updateState({
            lastSyncTime: Date.now(),
            syncStatus: 'synced'
          });
        }
      }
    }, 30000);
  }

  // 设置存储监听器
  private setupStorageListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'knowledge-blog-token') {
          this.loadAuthState();
        }
      });
    }
  }

  // Cookie 辅助方法
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(';').shift()!;
    return null;
  }

  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
  }

  // 状态更新
  private updateState(partialState: Partial<AuthState>): void {
    this.state = { ...this.state, ...partialState };
    this.listeners.forEach(listener => listener(this.state));
    
    this.emitEvent({
      type: 'state_sync',
      timestamp: Date.now(),
      data: this.state,
      source: 'client'
    });
  }

  // 订阅状态变化
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 订阅事件
  onEvent(listener: (event: AuthEvent) => void): () => void {
    this.eventListeners.add(listener);
    
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  // 发送事件
  private emitEvent(event: AuthEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }

  // 获取当前状态
  getCurrentState(): AuthState {
    return { ...this.state };
  }

  // 获取事件历史
  getEventHistory(): AuthEvent[] {
    // 可以在这里实现事件历史记录
    return [];
  }

  // 销毁实例
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.listeners.clear();
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}

// 导出单例实例
export const unifiedAuth = UnifiedAuthService.getInstance();

// React Hook
import { useEffect, useState } from 'react';

export function useUnifiedAuth() {
  const [state, setState] = useState<AuthState>(unifiedAuth.getCurrentState());

  useEffect(() => {
    // 初始化服务
    if (!unifiedAuth['isInitialized']) {
      unifiedAuth.initialize();
    }

    // 订阅状态变化
    const unsubscribe = unifiedAuth.subscribe(setState);

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...state,
    login: unifiedAuth.login.bind(unifiedAuth),
    logout: unifiedAuth.logout.bind(unifiedAuth),
    clearAllData: unifiedAuth.clearAllAuthData.bind(unifiedAuth),
    onEvent: unifiedAuth.onEvent.bind(unifiedAuth),
    getEventHistory: unifiedAuth.getEventHistory.bind(unifiedAuth)
  };
}