/**
 * 性能监控和报告工具
 */

import { useState, useEffect } from 'react';

export interface PerformanceMetrics {
  // 加载性能
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  
  // 自定义指标
  pageLoadTime: number;
  apiResponseTime: number;
  componentRenderTime: number;
  
  // 缓存指标
  cacheHitRate: number;
  prefetchSuccessRate: number;
  
  // 用户体验
  interactionTime: number;
  visualStability: number;
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * 初始化性能监控
   */
  private initialize() {
    if (this.isInitialized) return;

    this.setupCoreWebVitals();
    this.setupCustomMetrics();
    this.setupCacheMonitoring();
    this.isInitialized = true;
  }

  /**
   * 设置核心Web指标监控
   */
  private setupCoreWebVitals() {
    // First Contentful Paint
    this.observeMetric('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.firstContentfulPaint = fcpEntry.startTime;
        this.reportMetric('FCP', fcpEntry.startTime);
      }
    });

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lcpEntry = entries[entries.length - 1];
      if (lcpEntry) {
        this.metrics.largestContentfulPaint = lcpEntry.startTime;
        this.reportMetric('LCP', lcpEntry.startTime);
      }
    });

    // First Input Delay
    this.observeMetric('first-input', (entries) => {
      const fidEntry = entries[0] as any;
      if (fidEntry) {
        this.metrics.firstInputDelay = fidEntry.processingStart - fidEntry.startTime;
        this.reportMetric('FID', this.metrics.firstInputDelay);
      }
    });

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      const clsValue = entries.reduce((sum, entry: any) => sum + entry.value, 0);
      this.metrics.cumulativeLayoutShift = clsValue;
      this.reportMetric('CLS', clsValue);
    });
  }

  /**
   * 设置自定义指标监控
   */
  private setupCustomMetrics() {
    // 页面加载时间
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.startTime;
        this.reportMetric('PageLoad', this.metrics.pageLoadTime);
      }
    });

    // API响应时间
    this.interceptFetchCalls();

    // 组件渲染时间
    this.setupComponentTiming();
  }

  /**
   * 拦截Fetch调用监控API性能
   */
  private interceptFetchCalls() {
    const originalFetch = window.fetch;
    let apiCallCount = 0;
    let totalApiTime = 0;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        totalApiTime += duration;
        apiCallCount++;
        
        this.metrics.apiResponseTime = totalApiTime / apiCallCount;
        
        // 报告单个API调用
        if (args[0] && typeof args[0] === 'string') {
          this.reportApiMetric(String(args[0]), duration);
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.reportApiMetric(String(args[0]) || 'unknown', duration, true);
        throw error;
      }
    };
  }

  /**
   * 组件渲染时间监控
   */
  private setupComponentTiming() {
    // 监控React组件渲染（需要React DevTools Profiler）
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      // 这里可以集成React DevTools的渲染时间数据
    }
  }

  /**
   * 设置缓存监控
   */
  private setupCacheMonitoring() {
    // 监控缓存命中率
    if ('caches' in window) {
      this.monitorCachePerformance();
    }

    // 监控预取成功率
    this.monitorPrefetchPerformance();
  }

  /**
   * 监控缓存性能
   */
  private async monitorCachePerformance() {
    try {
      const cacheNames = await caches.keys();
      let totalRequests = 0;
      let cacheHits = 0;

      // 监听fetch事件
      self.addEventListener('fetch', (event) => {
        totalRequests++;
        // 这里需要更复杂的逻辑来判断缓存命中
      });

      setInterval(() => {
        if (totalRequests > 0) {
          this.metrics.cacheHitRate = (cacheHits / totalRequests) * 100;
          this.reportMetric('CacheHitRate', this.metrics.cacheHitRate);
        }
      }, 30000); // 每30秒报告一次
    } catch (error) {
      console.warn('Cache monitoring not available:', error);
    }
  }

  /**
   * 监控预取性能
   */
  private monitorPrefetchPerformance() {
    let prefetchAttempts = 0;
    let prefetchSuccesses = 0;

    // 监听预取事件
    document.addEventListener('prefetch', (event: any) => {
      prefetchAttempts++;
      if (event.detail.success) {
        prefetchSuccesses++;
      }
      
      this.metrics.prefetchSuccessRate = (prefetchSuccesses / prefetchAttempts) * 100;
      this.reportMetric('PrefetchSuccessRate', this.metrics.prefetchSuccessRate);
    });
  }

  /**
   * 观察性能指标
   */
  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  /**
   * 报告指标
   */
  private reportMetric(name: string, value: number, isError = false) {
    // 控制台日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}${isError ? ' (error)' : ''}`);
    }

    // 发送到分析服务（如果配置）
    this.sendToAnalytics(name, value, isError);

    // 本地存储用于调试
    this.storeMetricLocally(name, value);
  }

  /**
   * 报告API指标
   */
  private reportApiMetric(url: string, duration: number, isError = false) {
    const apiName = url.split('/').pop() || 'unknown';
    const metricName = `API_${apiName}`;
    
    this.reportMetric(metricName, duration, isError);
  }

  /**
   * 发送到分析服务
   */
  private sendToAnalytics(name: string, value: number, isError: boolean) {
    // 这里可以集成Google Analytics、自定义分析服务等
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        is_error: isError,
      });
    }
  }

  /**
   * 本地存储指标
   */
  private storeMetricLocally(name: string, value: number) {
    try {
      const key = `perf_${name}_${Date.now()}`;
      localStorage.setItem(key, value.toString());
      
      // 清理旧数据（保留最近1000条）
      this.cleanupOldData();
    } catch (error) {
      console.warn('Failed to store metric locally:', error);
    }
  }

  /**
   * 清理旧数据
   */
  private cleanupOldData() {
    try {
      const keys = Object.keys(localStorage);
      const perfKeys = keys.filter(key => key.startsWith('perf_'));
      
      if (perfKeys.length > 1000) {
        const keysToDelete = perfKeys.slice(0, perfKeys.length - 1000);
        keysToDelete.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to cleanup old data:', error);
    }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    score: number;
    recommendations: string[];
  } {
    const metrics = this.metrics as PerformanceMetrics;
    const score = this.calculatePerformanceScore(metrics);
    const recommendations = this.generateRecommendations(metrics);

    return {
      metrics,
      score,
      recommendations
    };
  }

  /**
   * 计算性能分数
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // FCP评分 (目标 < 1.8s)
    if (metrics.firstContentfulPaint > 1800) {
      score -= Math.min(30, (metrics.firstContentfulPaint - 1800) / 100);
    }

    // LCP评分 (目标 < 2.5s)
    if (metrics.largestContentfulPaint > 2500) {
      score -= Math.min(30, (metrics.largestContentfulPaint - 2500) / 100);
    }

    // FID评分 (目标 < 100ms)
    if (metrics.firstInputDelay > 100) {
      score -= Math.min(20, (metrics.firstInputDelay - 100) / 10);
    }

    // CLS评分 (目标 < 0.1)
    if (metrics.cumulativeLayoutShift > 0.1) {
      score -= Math.min(20, (metrics.cumulativeLayoutShift - 0.1) * 100);
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.firstContentfulPaint > 1800) {
      recommendations.push('考虑优化首屏内容渲染，可使用代码分割和预加载');
    }

    if (metrics.largestContentfulPaint > 2500) {
      recommendations.push('优化大图片和字体的加载，考虑使用CDN和懒加载');
    }

    if (metrics.firstInputDelay > 100) {
      recommendations.push('减少长任务，优化JavaScript执行时间');
    }

    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('为图片和广告预留空间，避免布局偏移');
    }

    if (metrics.cacheHitRate < 80) {
      recommendations.push('优化缓存策略，提高缓存命中率');
    }

    return recommendations;
  }

  /**
   * 销毁监控器
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor();

// React Hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    getReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor)
  };
}