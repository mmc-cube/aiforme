/**
 * 统一的日志和错误处理系统
 * 用于记录认证相关的所有事件和错误
 */

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'auth' | 'network' | 'storage' | 'security' | 'ui' | 'system';
  message: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId: string;
}

export interface LogFilter {
  level?: LogEntry['level'][];
  category?: LogEntry['category'][];
  startDate?: Date;
  endDate?: Date;
  search?: string;
  userId?: string;
}

export interface LogOptions {
  maxEntries?: number;
  persistToStorage?: boolean;
  includeStackTrace?: boolean;
  enableConsole?: boolean;
  remoteLogging?: boolean;
  remoteEndpoint?: string;
}

export class UnifiedLogger {
  private static instance: UnifiedLogger;
  private logs: LogEntry[] = [];
  private sessionId: string;
  private options: Required<LogOptions>;
  private remoteQueue: LogEntry[] = [];
  private isOnline = true;

  private constructor(options: LogOptions = {}) {
    this.sessionId = this.generateSessionId();
    this.options = {
      maxEntries: options.maxEntries ?? 1000,
      persistToStorage: options.persistToStorage ?? true,
      includeStackTrace: options.includeStackTrace ?? true,
      enableConsole: options.enableConsole ?? true,
      remoteLogging: options.remoteLogging ?? false,
      remoteEndpoint: options.remoteEndpoint ?? '/api/logs'
    };

    // 从存储加载日志
    this.loadFromStorage();

    // 监听在线状态
    this.setupOnlineStatusListener();

    // 设置定期远程同步
    this.setupRemoteSync();

    // 监听页面卸载
    this.setupUnloadListener();
  }

  static getInstance(options?: LogOptions): UnifiedLogger {
    if (!UnifiedLogger.instance) {
      UnifiedLogger.instance = new UnifiedLogger(options);
    }
    return UnifiedLogger.instance;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录日志
   */
  private log(level: LogEntry['level'], category: LogEntry['category'], message: string, data?: any): void {
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      stack: this.options.includeStackTrace && level === 'error' ? this.getStackTrace() : undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId
    };

    // 添加到内存
    this.logs.unshift(entry);

    // 限制日志数量
    if (this.logs.length > this.options.maxEntries) {
      this.logs = this.logs.slice(0, this.options.maxEntries);
    }

    // 持久化到存储
    if (this.options.persistToStorage) {
      this.saveToStorage();
    }

    // 控制台输出
    if (this.options.enableConsole) {
      this.logToConsole(entry);
    }

    // 远程日志
    if (this.options.remoteLogging) {
      this.queueRemoteLog(entry);
    }

    // 触发自定义事件
    this.dispatchEvent('log', entry);
  }

  /**
   * 生成日志ID
   */
  private generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取堆栈跟踪
   */
  private getStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3, 8).join('\n') : '';
  }

  /**
   * 获取当前用户ID
   */
  private getCurrentUserId(): string | undefined {
    try {
      const token = localStorage.getItem('knowledge-blog-token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.sub;
      }
    } catch (e) {
      // 忽略错误
    }
    return undefined;
  }

  /**
   * 控制台输出
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.category.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data);
        break;
      case 'info':
        console.info(message, entry.data);
        break;
      case 'warn':
        console.warn(message, entry.data);
        break;
      case 'error':
        console.error(message, entry.data);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }

  /**
   * 队列远程日志
   */
  private queueRemoteLog(entry: LogEntry): void {
    this.remoteQueue.push(entry);
    
    // 如果在线且队列达到一定数量，立即发送
    if (this.isOnline && this.remoteQueue.length >= 10) {
      this.flushRemoteQueue();
    }
  }

  /**
   * 刷新远程队列
   */
  private async flushRemoteQueue(): Promise<void> {
    if (this.remoteQueue.length === 0 || !this.isOnline) return;

    const logsToSend = [...this.remoteQueue];
    this.remoteQueue = [];

    try {
      const response = await fetch(this.options.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
        keepalive: true // 使用 keepalive 确保在页面卸载时也能发送
      });

      if (!response.ok) {
        // 如果发送失败，重新加入队列
        this.remoteQueue.unshift(...logsToSend);
      }
    } catch (error) {
      // 网络错误，重新加入队列
      this.remoteQueue.unshift(...logsToSend);
      console.warn('Failed to send logs remotely:', error);
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      const data = {
        logs: this.logs.slice(0, 100), // 只保存最近的100条
        sessionId: this.sessionId,
        version: '1.0'
      };
      localStorage.setItem('auth_logs', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save logs to storage:', e);
    }
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('auth_logs');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === '1.0' && Array.isArray(data.logs)) {
          this.logs = data.logs;
          this.sessionId = data.sessionId || this.sessionId;
        }
      }
    } catch (e) {
      console.warn('Failed to load logs from storage:', e);
    }
  }

  /**
   * 设置在线状态监听
   */
  private setupOnlineStatusListener(): void {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;
      if (this.isOnline) {
        // 恢复在线时，尝试发送队列中的日志
        this.flushRemoteQueue();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  /**
   * 设置远程同步
   */
  private setupRemoteSync(): void {
    // 每30秒同步一次
    setInterval(() => {
      if (this.options.remoteLogging) {
        this.flushRemoteQueue();
      }
    }, 30000);
  }

  /**
   * 设置卸载监听
   */
  private setupUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      // 页面卸载前尝试发送剩余日志
      if (this.options.remoteLogging && this.remoteQueue.length > 0) {
        // 使用 navigator.sendBeacon 确保发送
        const data = JSON.stringify({ logs: this.remoteQueue });
        navigator.sendBeacon(this.options.remoteEndpoint, data);
      }
    });
  }

  /**
   * 分发自定义事件
   */
  private dispatchEvent(type: string, data: any): void {
    window.dispatchEvent(new CustomEvent(`logger:${type}`, { detail: data }));
  }

  // 公共方法

  debug(category: LogEntry['category'], message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  info(category: LogEntry['category'], message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  warn(category: LogEntry['category'], message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  error(category: LogEntry['category'], message: string, error?: Error | any): void {
    const data = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    this.log('error', category, message, data);
  }

  /**
   * 获取日志
   */
  getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => filter.level!.includes(log.level));
      }

      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => filter.category!.includes(log.category));
      }

      if (filter.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!.getTime());
      }

      if (filter.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!.getTime());
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchLower) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower))
        );
      }

      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
      }
    }

    return filteredLogs;
  }

  /**
   * 清除日志
   */
  clearLogs(category?: LogEntry['category']): void {
    if (category) {
      this.logs = this.logs.filter(log => log.category !== category);
    } else {
      this.logs = [];
    }
    
    if (this.options.persistToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * 导出日志
   */
  exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs
    }, null, 2);
  }

  /**
   * 订阅日志事件
   */
  onLog(callback: (entry: LogEntry) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('logger:log', handler as EventListener);
    return () => window.removeEventListener('logger:log', handler as EventListener);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalLogs: number;
    byLevel: Record<LogEntry['level'], number>;
    byCategory: Record<LogEntry['category'], number>;
    sessionCount: number;
  } {
    const byLevel: Record<LogEntry['level'], number> = { debug: 0, info: 0, warn: 0, error: 0 };
    const byCategory: Record<LogEntry['category'], number> = { 
      auth: 0, network: 0, storage: 0, security: 0, ui: 0, system: 0 
    };

    this.logs.forEach(log => {
      byLevel[log.level]++;
      byCategory[log.category]++;
    });

    return {
      totalLogs: this.logs.length,
      byLevel,
      byCategory,
      sessionCount: new Set(this.logs.map(log => log.sessionId)).size
    };
  }
}

// 导出单例实例
export const logger = UnifiedLogger.getInstance({
  maxEntries: 1000,
  persistToStorage: true,
  includeStackTrace: true,
  enableConsole: true,
  remoteLogging: false, // 默认关闭远程日志，可根据需要启用
});

// 便捷的日志函数
export const log = {
  debug: (category: LogEntry['category'], message: string, data?: any) => logger.debug(category, message, data),
  info: (category: LogEntry['category'], message: string, data?: any) => logger.info(category, message, data),
  warn: (category: LogEntry['category'], message: string, data?: any) => logger.warn(category, message, data),
  error: (category: LogEntry['category'], message: string, error?: any) => logger.error(category, message, error)
};

// 错误处理工具
export class ErrorHandler {
  /**
   * 包装异步函数，自动捕获和记录错误
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    category: LogEntry['category'],
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      log.error(category, `${context || 'Async operation'} failed`, error);
      return null;
    }
  }

  /**
   * 创建带错误处理的函数包装器
   */
  static createWrapper<F extends (...args: any[]) => any>(
    fn: F,
    category: LogEntry['category'],
    context?: string
  ): (...args: Parameters<F>) => ReturnType<F> | null {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        log.error(category, `${context || 'Function call'} failed`, error);
        return null;
      }
    };
  }

  /**
   * 全局错误处理器
   */
  static setupGlobalHandlers(): void {
    // 未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      log.error('system', 'Unhandled promise rejection', event.reason);
      // 阻止默认控制台输出
      event.preventDefault();
    });

    // 全局JavaScript错误
    window.addEventListener('error', (event) => {
      log.error('system', 'Global JavaScript error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // 网络错误
    window.addEventListener('offline', () => {
      log.warn('network', 'Network connection lost');
    });

    window.addEventListener('online', () => {
      log.info('network', 'Network connection restored');
    });
  }
}