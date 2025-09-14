export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  size: number;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  fileModified?: number;
}

export class APICache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private maxSize: number;
  private stats: CacheStats;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      size: 0
    };
  }

  /**
   * 生成缓存键
   */
  private generateKey(namespace: string, identifier: string): string {
    return `${namespace}:${identifier}`;
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem<T>): boolean {
    const now = Date.now();
    return (now - item.timestamp) > item.ttl;
  }

  /**
   * 检查文件是否被修改（需要刷新缓存）
   */
  private isFileModified(item: CacheItem<T>, filePath?: string): boolean {
    if (!item.fileModified || !filePath) return false;
    
    // 只在服务器端检查文件修改
    if (typeof window !== 'undefined') return false;
    
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      return stats.mtimeMs > item.fileModified;
    } catch {
      return false;
    }
  }

  /**
   * 执行LRU淘汰策略
   */
  private evict(): void {
    if (this.cache.size < this.maxSize) return;

    // 找出最近最少使用的项目
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    const entries = this.cache.entries();
    let entry = entries.next();
    while (!entry.done) {
      const [key, item] = entry.value;
      if (item.lastAccessed < oldestAccess) {
        oldestAccess = item.lastAccessed;
        oldestKey = key;
      }
      entry = entries.next();
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
    }
  }

  /**
   * 获取缓存项
   */
  get(namespace: string, identifier: string, filePath?: string): T | null {
    const key = this.generateKey(namespace, identifier);
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      return null;
    }

    // 检查文件是否被修改
    if (this.isFileModified(item, filePath)) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      return null;
    }

    // 更新访问记录
    item.lastAccessed = Date.now();
    item.accessCount++;
    this.stats.hits++;

    return item.data;
  }

  /**
   * 设置缓存项
   */
  set(
    namespace: string, 
    identifier: string, 
    data: T, 
    ttl: number, 
    filePath?: string
  ): void {
    const key = this.generateKey(namespace, identifier);
    
    // 检查是否需要淘汰
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    let fileModified: number | undefined;
    if (filePath && typeof window === 'undefined') {
      try {
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        fileModified = stats.mtimeMs;
      } catch {
        // 文件不存在时忽略
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      fileModified
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  /**
   * 删除缓存项
   */
  delete(namespace: string, identifier: string): boolean {
    const key = this.generateKey(namespace, identifier);
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * 清空整个缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 获取命中率
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total) * 100;
  }

  /**
   * 获取缓存详情（用于调试）
   */
  getCacheDetails(): Array<{
    key: string;
    data: T;
    ttl: number;
    age: number;
    accessCount: number;
    lastAccessed: number;
    isExpired: boolean;
  }> {
    const now = Date.now();
    const result: Array<{
      key: string;
      data: T;
      ttl: number;
      age: number;
      accessCount: number;
      lastAccessed: number;
      isExpired: boolean;
    }> = [];
    
    const entries = this.cache.entries();
    let entry = entries.next();
    while (!entry.done) {
      const [key, item] = entry.value;
      result.push({
        key,
        data: item.data,
        ttl: item.ttl,
        age: now - item.timestamp,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed,
        isExpired: this.isExpired(item)
      });
      entry = entries.next();
    }
    
    return result;
  }
}

// 创建全局缓存实例
const postsCache = new APICache<any>(50); // 最大缓存50个项目

// 缓存配置
export const CACHE_CONFIG = {
  POSTS_LIST: {
    TTL: 5 * 60 * 1000, // 5分钟
    NAMESPACE: 'posts-list'
  },
  SINGLE_POST: {
    TTL: 10 * 60 * 1000, // 10分钟
    NAMESPACE: 'single-post'
  },
  POSTS_BY_TAG: {
    TTL: 5 * 60 * 1000, // 5分钟
    NAMESPACE: 'posts-by-tag'
  },
  ALL_TAGS: {
    TTL: 10 * 60 * 1000, // 10分钟
    NAMESPACE: 'all-tags'
  },
  SEARCH: {
    TTL: 2 * 60 * 1000, // 2分钟
    NAMESPACE: 'search'
  }
};

// 导出全局缓存实例
export { postsCache as default };