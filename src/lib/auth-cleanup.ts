/**
 * 认证状态清理工具
 * 用于处理认证相关数据的清理和同步问题
 */

export interface CleanupResult {
  success: boolean;
  clearedItems: string[];
  errors: string[];
  summary: {
    cookies: number;
    localStorage: number;
    sessionStorage: number;
    memory: number;
  };
}

export interface CleanupOptions {
  clearCookies?: boolean;
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearMemory?: boolean;
  clearServiceWorker?: boolean;
  clearCache?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  dryRun?: boolean;
}

export class AuthCleanupService {
  private static instance: AuthCleanupService;

  private constructor() {}

  static getInstance(): AuthCleanupService {
    if (!AuthCleanupService.instance) {
      AuthCleanupService.instance = new AuthCleanupService();
    }
    return AuthCleanupService.instance;
  }

  /**
   * 执行完整的认证清理
   */
  async cleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      clearedItems: [],
      errors: [],
      summary: {
        cookies: 0,
        localStorage: 0,
        sessionStorage: 0,
        memory: 0
      }
    };

    const finalOptions: Required<CleanupOptions> = {
      clearCookies: options.clearCookies ?? true,
      clearLocalStorage: options.clearLocalStorage ?? true,
      clearSessionStorage: options.clearSessionStorage ?? true,
      clearMemory: options.clearMemory ?? true,
      clearServiceWorker: options.clearServiceWorker ?? false,
      clearCache: options.clearCache ?? false,
      includePatterns: options.includePatterns ?? [
        'auth',
        'token',
        'session',
        'user',
        'admin',
        'knowledge-blog'
      ],
      excludePatterns: options.excludePatterns ?? [],
      dryRun: options.dryRun ?? false
    };

    try {
      // 清理 Cookie
      if (finalOptions.clearCookies) {
        const cookieResult = await this.cleanupCookies(finalOptions);
        result.summary.cookies = cookieResult.count;
        result.clearedItems.push(...cookieResult.items);
        result.errors.push(...cookieResult.errors);
      }

      // 清理 localStorage
      if (finalOptions.clearLocalStorage) {
        const storageResult = await this.cleanupLocalStorage(finalOptions);
        result.summary.localStorage = storageResult.count;
        result.clearedItems.push(...storageResult.items);
        result.errors.push(...storageResult.errors);
      }

      // 清理 sessionStorage
      if (finalOptions.clearSessionStorage) {
        const sessionResult = await this.cleanupSessionStorage(finalOptions);
        result.summary.sessionStorage = sessionResult.count;
        result.clearedItems.push(...sessionResult.items);
        result.errors.push(...sessionResult.errors);
      }

      // 清理内存中的状态
      if (finalOptions.clearMemory) {
        const memoryResult = this.cleanupMemory(finalOptions);
        result.summary.memory = memoryResult.count;
        result.clearedItems.push(...memoryResult.items);
      }

      // 清理 Service Worker
      if (finalOptions.clearServiceWorker) {
        const swResult = await this.cleanupServiceWorker(finalOptions);
        result.clearedItems.push(...swResult.items);
        result.errors.push(...swResult.errors);
      }

      // 清理缓存
      if (finalOptions.clearCache) {
        const cacheResult = await this.cleanupCache(finalOptions);
        result.clearedItems.push(...cacheResult.items);
        result.errors.push(...cacheResult.errors);
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`清理过程中发生错误: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 清理认证相关的 Cookie
   */
  private async cleanupCookies(options: Required<CleanupOptions>): Promise<{ count: number; items: string[]; errors: string[] }> {
    const items: string[] = [];
    const errors: string[] = [];
    let count = 0;

    if (typeof document === 'undefined') {
      return { count, items, errors };
    }

    try {
      const cookies = document.cookie.split(';');
      const authCookieNames = ['admin_token', 'auth_token', 'session_token', 'knowledge-blog-token'];

      for (const cookie of cookies) {
        const [name] = cookie.trim().split('=');
        
        if (this.shouldCleanupItem(name, options.includePatterns, options.excludePatterns)) {
          if (!options.dryRun) {
            this.deleteCookie(name);
          }
          items.push(`Cookie: ${name}`);
          count++;
        }
      }

      // 确保清除所有已知的认证 cookie
      for (const cookieName of authCookieNames) {
        if (!options.dryRun) {
          this.deleteCookie(cookieName);
          // 尝试不同的域和路径
          this.deleteCookieWithDomain(cookieName, 'localhost');
          this.deleteCookieWithDomain(cookieName, '');
          this.deleteCookieWithPath(cookieName, '/');
          this.deleteCookieWithPath(cookieName, '/admin');
        }
        if (!items.includes(`Cookie: ${cookieName}`)) {
          items.push(`Cookie: ${cookieName}`);
          count++;
        }
      }
    } catch (error) {
      errors.push(`清理 Cookie 失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { count, items, errors };
  }

  /**
   * 清理 localStorage 中的认证数据
   */
  private async cleanupLocalStorage(options: Required<CleanupOptions>): Promise<{ count: number; items: string[]; errors: string[] }> {
    const items: string[] = [];
    const errors: string[] = [];
    let count = 0;

    if (typeof localStorage === 'undefined') {
      return { count, items, errors };
    }

    try {
      const keysToDelete: string[] = [];

      // 收集需要删除的键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && this.shouldCleanupItem(key, options.includePatterns, options.excludePatterns)) {
          keysToDelete.push(key);
        }
      }

      // 执行删除
      for (const key of keysToDelete) {
        if (!options.dryRun) {
          localStorage.removeItem(key);
        }
        items.push(`localStorage: ${key}`);
        count++;
      }
    } catch (error) {
      errors.push(`清理 localStorage 失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { count, items, errors };
  }

  /**
   * 清理 sessionStorage 中的认证数据
   */
  private async cleanupSessionStorage(options: Required<CleanupOptions>): Promise<{ count: number; items: string[]; errors: string[] }> {
    const items: string[] = [];
    const errors: string[] = [];
    let count = 0;

    if (typeof sessionStorage === 'undefined') {
      return { count, items, errors };
    }

    try {
      const keysToDelete: string[] = [];

      // 收集需要删除的键
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && this.shouldCleanupItem(key, options.includePatterns, options.excludePatterns)) {
          keysToDelete.push(key);
        }
      }

      // 执行删除
      for (const key of keysToDelete) {
        if (!options.dryRun) {
          sessionStorage.removeItem(key);
        }
        items.push(`sessionStorage: ${key}`);
        count++;
      }
    } catch (error) {
      errors.push(`清理 sessionStorage 失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { count, items, errors };
  }

  /**
   * 清理内存中的认证状态
   */
  private cleanupMemory(options: Required<CleanupOptions>): { count: number; items: string[] } {
    const items: string[] = [];
    let count = 0;

    if (!options.dryRun) {
      // 触发自定义事件通知所有组件清理状态
      window.dispatchEvent(new CustomEvent('auth:cleanup', {
        detail: { reason: 'manual_cleanup' }
      }));

      // 清理统一认证服务实例
      if (typeof window !== 'undefined' && (window as any).unifiedAuth) {
        try {
          (window as any).unifiedAuth.destroy();
          items.push('UnifiedAuth instance destroyed');
          count++;
        } catch (error) {
          console.error('Failed to destroy UnifiedAuth:', error);
        }
      }

      // 强制垃圾回收（如果可用）
      if (typeof (window as any).gc === 'function') {
        (window as any).gc();
        items.push('Forced garbage collection triggered');
        count++;
      }
    }

    return { count, items };
  }

  /**
   * 清理 Service Worker
   */
  private async cleanupServiceWorker(options: Required<CleanupOptions>): Promise<{ items: string[]; errors: string[] }> {
    const items: string[] = [];
    const errors: string[] = [];

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return { items, errors };
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        if (this.shouldCleanupItem(registration.scope, options.includePatterns, options.excludePatterns)) {
          if (!options.dryRun) {
            await registration.unregister();
          }
          items.push(`ServiceWorker unregistered: ${registration.scope}`);
        }
      }
    } catch (error) {
      errors.push(`清理 Service Worker 失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { items, errors };
  }

  /**
   * 清理缓存
   */
  private async cleanupCache(options: Required<CleanupOptions>): Promise<{ items: string[]; errors: string[] }> {
    const items: string[] = [];
    const errors: string[] = [];

    if (typeof caches === 'undefined') {
      return { items, errors };
    }

    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (this.shouldCleanupItem(cacheName, options.includePatterns, options.excludePatterns)) {
          if (!options.dryRun) {
            await caches.delete(cacheName);
          }
          items.push(`Cache deleted: ${cacheName}`);
        }
      }
    } catch (error) {
      errors.push(`清理缓存失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { items, errors };
  }

  /**
   * 判断是否应该清理某个项目
   */
  private shouldCleanupItem(itemName: string, includePatterns: string[], excludePatterns: string[]): boolean {
    const lowerItem = itemName.toLowerCase();
    
    // 检查排除模式
    for (const pattern of excludePatterns) {
      if (lowerItem.includes(pattern.toLowerCase())) {
        return false;
      }
    }
    
    // 检查包含模式
    for (const pattern of includePatterns) {
      if (lowerItem.includes(pattern.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 删除 Cookie
   */
  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  }

  /**
   * 使用特定域删除 Cookie
   */
  private deleteCookieWithDomain(name: string, domain: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
  }

  /**
   * 使用特定路径删除 Cookie
   */
  private deleteCookieWithPath(name: string, path: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
  }

  /**
   * 获取认证相关的数据摘要
   */
  async getAuthDataSummary(): Promise<{
    cookies: Array<{ name: string; value?: string }>;
    localStorage: Array<{ key: string; size?: number }>;
    sessionStorage: Array<{ key: string; size?: number }>;
    serviceWorkers: Array<{ scope: string; state: string }>;
    caches: string[];
    memoryUsage?: any;
  }> {
    const summary = {
      cookies: [] as Array<{ name: string; value?: string }>,
      localStorage: [] as Array<{ key: string; size?: number }>,
      sessionStorage: [] as Array<{ key: string; size?: number }>,
      serviceWorkers: [] as Array<{ scope: string; state: string }>,
      caches: [] as string[],
      memoryUsage: undefined as any
    };

    // 获取 Cookie
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name && this.shouldCleanupItem(name, ['auth', 'token', 'session'], [])) {
          summary.cookies.push({ 
            name, 
            value: value ? `${value.substring(0, 10)}...` : undefined 
          });
        }
      }
    }

    // 获取 localStorage
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && this.shouldCleanupItem(key, ['auth', 'token', 'session'], [])) {
          const value = localStorage.getItem(key);
          summary.localStorage.push({ 
            key, 
            size: value ? new Blob([value]).size : undefined 
          });
        }
      }
    }

    // 获取 sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && this.shouldCleanupItem(key, ['auth', 'token', 'session'], [])) {
          const value = sessionStorage.getItem(key);
          summary.sessionStorage.push({ 
            key, 
            size: value ? new Blob([value]).size : undefined 
          });
        }
      }
    }

    // 获取 Service Worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        summary.serviceWorkers.push({
          scope: registration.scope,
          state: registration.active?.state || 'unknown'
        });
      }
    }

    // 获取缓存
    if (typeof caches !== 'undefined') {
      summary.caches = await caches.keys();
    }

    // 获取内存使用情况（如果支持）
    if (typeof (performance as any).memory !== 'undefined') {
      summary.memoryUsage = (performance as any).memory;
    }

    return summary;
  }

  /**
   * 执行深度清理（包括强制刷新）
   */
  async deepCleanup(): Promise<void> {
    // 执行完整清理
    await this.cleanup({
      clearCookies: true,
      clearLocalStorage: true,
      clearSessionStorage: true,
      clearMemory: true,
      clearServiceWorker: true,
      clearCache: true
    });

    // 延迟后刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// 导出单例实例
export const authCleanup = AuthCleanupService.getInstance();