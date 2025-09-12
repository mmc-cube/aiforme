/**
 * 智能预取管理器
 * 实现基于用户行为的预测性预取
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PrefetchConfig {
  enabled: boolean;
  delay: number;
  maxCacheSize: number;
  ttl: number;
  prefetchOnHover: boolean;
  prefetchVisible: boolean;
}

interface UserBehavior {
  mouseMovements: { x: number; y: number; timestamp: number }[];
  clicks: { element: string; timestamp: number }[];
  scrolls: { position: number; timestamp: number }[];
  pageVisits: { page: string; duration: number }[];
}

export class IntelligentPrefetchManager {
  private cache = new Map<string, CacheEntry<any>>();
  private prefetchQueue = new Set<string>();
  private isPrefetching = false;
  private userBehavior: UserBehavior = {
    mouseMovements: [],
    clicks: [],
    scrolls: [],
    pageVisits: []
  };
  
  private config: Required<PrefetchConfig> = {
    enabled: true,
    delay: 300,
    maxCacheSize: 50,
    ttl: 5 * 60 * 1000, // 5分钟
    prefetchOnHover: true,
    prefetchVisible: true
  };

  constructor(config?: Partial<PrefetchConfig>) {
    this.config = { ...this.config, ...config };
    this.initializeBehaviorTracking();
    this.startCleanupTimer();
  }

  /**
   * 初始化用户行为追踪
   */
  private initializeBehaviorTracking() {
    if (typeof window === 'undefined') return;

    // 鼠标移动追踪
    document.addEventListener('mousemove', (e) => {
      this.userBehavior.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
      
      // 保持最近100个移动记录
      if (this.userBehavior.mouseMovements.length > 100) {
        this.userBehavior.mouseMovements.shift();
      }
    });

    // 点击追踪
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      this.userBehavior.clicks.push({
        element: target.tagName.toLowerCase(),
        timestamp: Date.now()
      });
    });

    // 滚动追踪
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.userBehavior.scrolls.push({
          position: window.scrollY,
          timestamp: Date.now()
        });
        
        if (this.userBehavior.scrolls.length > 50) {
          this.userBehavior.scrolls.shift();
        }
      }, 100);
    });
  }

  /**
   * 预测用户可能访问的链接
   */
  private predictNextPage(): string[] {
    const predictions: string[] = [];
    
    // 基于鼠标移动方向预测
    if (this.userBehavior.mouseMovements.length >= 2) {
      const recent = this.userBehavior.mouseMovements.slice(-10);
      const avgX = recent.reduce((sum, m) => sum + m.x, 0) / recent.length;
      const avgY = recent.reduce((sum, m) => sum + m.y, 0) / recent.length;
      
      // 如果鼠标向右移动，可能想要点击文章链接
      if (avgX > window.innerWidth / 2) {
        const links = this.getVisibleLinks();
        predictions.push(...links.slice(0, 3));
      }
    }
    
    // 基于历史点击模式预测
    if (this.userBehavior.clicks.length > 0) {
      const recentClicks = this.userBehavior.clicks.slice(-5);
      const linkClicks = recentClicks.filter(c => c.element === 'a');
      
      if (linkClicks.length >= 2) {
        // 用户最近经常点击链接，预测会继续点击
        const links = this.getVisibleLinks();
        predictions.push(...links.slice(0, 2));
      }
    }
    
    return [...new Set(predictions)].slice(0, 5);
  }

  /**
   * 获取当前可见的链接
   */
  private getVisibleLinks(): string[] {
    if (typeof document === 'undefined') return [];
    
    const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    const visibleLinks: string[] = [];
    
    links.forEach(link => {
      const rect = link.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth &&
        rect.width > 0 &&
        rect.height > 0
      );
      
      if (isVisible && link.href) {
        const url = new URL(link.href);
        if (url.pathname.startsWith('/posts/')) {
          visibleLinks.push(url.pathname);
        }
      }
    });
    
    return visibleLinks;
  }

  /**
   * 预取单个URL
   */
  async prefetch(url: string): Promise<void> {
    if (!this.config.enabled) return;
    if (this.cache.has(url)) return;
    if (this.prefetchQueue.has(url)) return;

    this.prefetchQueue.add(url);

    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // 存入缓存
      this.cache.set(url, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.ttl
      });

      console.log(`[Prefetch] 预取成功: ${url}`);
    } catch (error) {
      console.warn(`[Prefetch] 预取失败: ${url}`, error);
    } finally {
      this.prefetchQueue.delete(url);
    }
  }

  /**
   * 批量预取
   */
  async prefetchMultiple(urls: string[]): Promise<void> {
    if (!this.config.enabled) return;
    
    // 清理已过期的缓存
    this.cleanupExpiredCache();
    
    // 过滤已缓存或正在预取的URL
    const uniqueUrls = [...new Set(urls)];
    const urlsToPrefetch = uniqueUrls.filter(url => 
      !this.cache.has(url) && !this.prefetchQueue.has(url)
    );

    // 限制并发数量
    const batchSize = 3;
    for (let i = 0; i < urlsToPrefetch.length; i += batchSize) {
      const batch = urlsToPrefetch.slice(i, i + batchSize);
      await Promise.all(batch.map(url => this.prefetch(url)));
    }
  }

  /**
   * 智能预取（基于用户行为）
   */
  async intelligentPrefetch(): Promise<void> {
    if (!this.config.enabled) return;
    if (this.isPrefetching) return;

    this.isPrefetching = true;
    
    try {
      const predictions = this.predictNextPage();
      await this.prefetchMultiple(predictions);
    } catch (error) {
      console.warn('[Prefetch] 智能预取失败:', error);
    } finally {
      this.isPrefetching = false;
    }
  }

  /**
   * 获取缓存数据
   */
  getFromCache<T>(url: string): T | null {
    const entry = this.cache.get(url);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(url);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [url, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(url);
      }
    }

    // 如果缓存过大，删除最旧的条目
    if (this.cache.size > this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, this.cache.size - this.config.maxCacheSize);
      toDelete.forEach(([url]) => this.cache.delete(url));
    }
  }

  /**
   * 定期清理缓存
   */
  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return;
    
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60 * 1000); // 每分钟清理一次
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      prefetchQueueSize: this.prefetchQueue.size,
      config: this.config,
      behavior: {
        mouseMovements: this.userBehavior.mouseMovements.length,
        clicks: this.userBehavior.clicks.length,
        scrolls: this.userBehavior.scrolls.length,
        pageVisits: this.userBehavior.pageVisits.length
      }
    };
  }

  /**
   * 设置配置
   */
  setConfig(newConfig: Partial<PrefetchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.prefetchQueue.clear();
  }
}

// 全局实例
export const prefetchManager = new IntelligentPrefetchManager();

// React Hook
export function usePrefetch() {
  const prefetch = (url: string) => {
    prefetchManager.prefetch(url);
  };

  const prefetchMultiple = (urls: string[]) => {
    prefetchManager.prefetchMultiple(urls);
  };

  const intelligentPrefetch = () => {
    prefetchManager.intelligentPrefetch();
  };

  const getStats = () => {
    return prefetchManager.getStats();
  };

  return { prefetch, prefetchMultiple, intelligentPrefetch, getStats };
}