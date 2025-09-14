'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
}

/**
 * 通用懒加载组件
 * 使用 Intersection Observer API 实现可视区域的懒加载
 */
export function LazyLoad({
  children,
  fallback = <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  className = ''
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasLoaded(true);
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasLoaded]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

interface CodeSplitProps {
  importFn: () => Promise<any>;
  fallback?: React.ReactNode;
  componentName?: string;
  props?: any;
  exportName?: string; // 支持命名导出
}

/**
 * 代码分割组件
 * 动态导入React组件，支持默认导出和命名导出
 */
export function CodeSplit({
  importFn,
  fallback = <div className="animate-pulse bg-gray-200 rounded-lg p-4">Loading...</div>,
  componentName = 'Component',
  props = {},
  exportName = 'default' // 默认使用default导出
}: CodeSplitProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        const importedModule = await importFn();
        if (isMounted) {
          // 支持默认导出和命名导出
          const componentToLoad = exportName === 'default' ? importedModule.default : importedModule[exportName];
          if (componentToLoad) {
            setComponent(() => componentToLoad);
          } else {
            throw new Error(`Component ${exportName} not found in module`);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load component');
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [importFn, exportName]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <h3 className="font-medium mb-2">Component Load Error</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!Component) {
    return <>{fallback}</>;
  }

  return <Component {...props} />;
}

interface ImageLazyLoadProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 图片懒加载组件
 * 支持加载占位符和错误处理
 */
export function ImageLazyLoad({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  onLoad,
  onError
}: ImageLazyLoadProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-gray-400 text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">图片加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!isLoaded && placeholder && (
        <div className="absolute inset-0">
          <img
            src={placeholder}
            alt=""
            className="w-full h-full object-cover filter blur-sm"
            style={{ transform: 'scale(1.1)' }}
          />
        </div>
      )}
      
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

interface VirtualScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

/**
 * 虚拟滚动列表组件
 * 用于大量数据的高性能渲染
 */
export function VirtualScrollList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 3,
  className = ''
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const offsetY = startIndex * itemHeight;
  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, width: '100%' }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 预设的懒加载组件
export const LazyLoginForm = () => (
  <CodeSplit
    importFn={() => import('@/components/LoginForm')}
    componentName="LoginForm"
  />
);

export const LazyAuthProvider = () => (
  <CodeSplit
    importFn={() => import('@/components/AuthProvider')}
    componentName="AuthProvider"
    exportName="AuthProvider" // 使用命名导出
  />
);

// 性能监控Hook
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactions: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        loadTime: endTime - startTime
      }));
    };
  }, [componentName]);

  const trackInteraction = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      interactions: prev.interactions + 1
    }));
  }, []);

  return { metrics, trackInteraction };
}