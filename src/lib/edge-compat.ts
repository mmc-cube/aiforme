/**
 * Edge浏览器兼容性工具
 * 解决Edge浏览器特有的Cookie和认证问题
 */

export class EdgeCompat {
  
  /**
   * 检测是否为Edge浏览器
   */
  static isEdgeBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('edg/') || userAgent.includes('edge/');
  }

  /**
   * 检测是否为开发环境
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * 获取Edge浏览器兼容的Cookie配置
   */
  static getEdgeCompatibleCookieOptions() {
    const isDev = this.isDevelopment();
    
    return {
      httpOnly: true,
      secure: !isDev, // 开发环境下不使用secure
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
      // Edge浏览器在开发环境下需要明确指定domain
      domain: isDev ? 'localhost' : undefined,
      // 添加Edge特定的属性
      partitioned: false,
      priority: 'high' as const
    };
  }

  /**
   * 增强的fetch请求，支持Edge浏览器
   */
  static async edgeCompatibleFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const isEdge = this.isEdgeBrowser();
    
    // Edge浏览器特定的请求配置
    const edgeOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        // Edge浏览器可能需要额外的头部
        ...(isEdge && {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        })
      }
    };

    console.log(`🌐 Edge兼容性请求: ${url}`, {
      isEdgeBrowser: isEdge,
      credentials: edgeOptions.credentials,
      method: options.method || 'GET'
    });

    try {
      const response = await fetch(url, edgeOptions);
      
      // 检查响应状态
      if (!response.ok) {
        console.warn(`⚠️ 请求失败: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Edge兼容性请求失败:', error);
      
      // 如果是CORS错误，尝试备用方案
      if (error instanceof Error && error.name === 'TypeError') {
        console.log('🔄 尝试备用请求方案...');
        return fetch(url, {
          ...edgeOptions,
          mode: 'cors',
          credentials: 'same-origin'
        });
      }
      
      throw error;
    }
  }

  /**
   * Edge浏览器Cookie测试工具
   */
  static async testCookieSupport(): Promise<{
    supported: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // 测试Cookie设置
      document.cookie = 'edge_test=test; path=/; max-age=60';
      const hasTestCookie = document.cookie.includes('edge_test');
      
      if (!hasTestCookie) {
        issues.push('Cookie设置失败');
        recommendations.push('检查浏览器Cookie设置');
      }

      // 测试LocalStorage
      try {
        localStorage.setItem('edge_test', 'test');
        localStorage.removeItem('edge_test');
      } catch (e) {
        issues.push('LocalStorage不可用');
        recommendations.push('启用LocalStorage或使用SessionStorage');
      }

      // 测试SessionStorage
      try {
        sessionStorage.setItem('edge_test', 'test');
        sessionStorage.removeItem('edge_test');
      } catch (e) {
        issues.push('SessionStorage不可用');
        recommendations.push('检查浏览器隐私设置');
      }

      return {
        supported: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        supported: false,
        issues: ['Cookie测试失败'],
        recommendations: ['刷新页面重试', '清除浏览器缓存']
      };
    }
  }

  /**
   * 获取Edge浏览器特定的调试信息
   */
  static getEdgeDebugInfo() {
    if (typeof window === 'undefined') return null;

    return {
      userAgent: navigator.userAgent,
      isEdge: this.isEdgeBrowser(),
      cookieEnabled: navigator.cookieEnabled,
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      documentCookies: document.cookie,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 统一的认证API调用工具（Edge兼容）
 */
export class EdgeAuthAPI {
  
  /**
   * Edge兼容的管理员登录
   */
  static async login(credentials: { username: string; password: string }) {
    return EdgeCompat.edgeCompatibleFetch('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
  }

  /**
   * Edge兼容的认证验证
   */
  static async verify() {
    return EdgeCompat.edgeCompatibleFetch('/api/admin/auth/verify', {
      method: 'GET',
    });
  }

  /**
   * Edge兼容的登出
   */
  static async logout() {
    return EdgeCompat.edgeCompatibleFetch('/api/admin/auth/logout', {
      method: 'POST',
    });
  }
}

// 导出单例实例
export const edgeAuthAPI = new EdgeAuthAPI();