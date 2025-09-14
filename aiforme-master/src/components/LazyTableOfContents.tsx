'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { prefetchManager, usePrefetch } from '@/lib/prefetch';

interface LazyTableOfContentsProps {
  content: string;
  enableSmoothScroll?: boolean;
  delay?: number;
  className?: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * 懒加载的目录组件
 * 延迟加载并支持平滑滚动
 */
export function LazyTableOfContents({ 
  content, 
  enableSmoothScroll = true,
  delay = 300,
  className = ''
}: LazyTableOfContentsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);
  const { prefetch } = usePrefetch();

  // 延迟加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // 解析标题
  useEffect(() => {
    if (!isVisible || isLoaded) return;

    const parseHeadings = () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      const parsedHeadings: Heading[] = Array.from(headingElements).map((heading, index) => {
        const text = heading.textContent || '';
        let id = heading.id;
        
        // 生成ID
        if (!id) {
          id = text
            .toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
            .replace(/\s+/g, '-');
          
          // 确保ID唯一
          const existingIds = parsedHeadings.map(h => h.id);
          let finalId = id;
          let counter = 1;
          
          while (existingIds.includes(finalId)) {
            finalId = `${id}-${counter}`;
            counter++;
          }
          
          id = finalId;
        }
        
        return {
          id,
          text,
          level: parseInt(heading.tagName.charAt(1))
        };
      });

      setHeadings(parsedHeadings);
      setIsLoaded(true);
    };

    parseHeadings();
  }, [isVisible, content, isLoaded]);

  // 滚动监听
  useEffect(() => {
    if (!enableSmoothScroll || !isLoaded) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // 偏移量
      
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = document.getElementById(headings[i].id);
        if (heading && scrollPosition >= heading.offsetTop) {
          setActiveHeading(headings[i].id);
          break;
        }
      }
    };

    const throttledHandleScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledHandleScroll);
    handleScroll(); // 初始检查

    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [headings, enableSmoothScroll, isLoaded]);

  // 点击滚动
  const handleClick = useCallback((headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      const offset = 80; // 与CSS scroll-mt-20匹配
      const top = element.offsetTop - offset;
      
      window.scrollTo({
        top,
        behavior: 'smooth'
      });

      // 更新URL hash但不触发滚动
      history.pushState(null, '', `#${headingId}`);
    }
  }, []);

  if (!isVisible) {
    return (
      <div className={`w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-3 bg-gray-200 rounded" style={{ width: `${70 - i * 10}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (headings.length === 0) {
    return null;
  }

  return (
    <div 
      ref={tocRef}
      className={`w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        目录
      </h3>
      
      <nav className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => handleClick(heading.id)}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
              activeHeading === heading.id
                ? 'bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            style={{
              paddingLeft: `${(heading.level - 1) * 12 + 12}px`
            }}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
}

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  let lastExecTime = 0;
  
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}

// 预取增强的目录组件
interface EnhancedTableOfContentsProps extends LazyTableOfContentsProps {
  enablePrefetch?: boolean;
  prefetchHeadings?: boolean;
}

export function EnhancedTableOfContents({
  content,
  enableSmoothScroll = true,
  delay = 300,
  className = '',
  enablePrefetch = true,
  prefetchHeadings = true
}: EnhancedTableOfContentsProps) {
  const [relatedPosts, setRelatedPosts] = useState<string[]>([]);
  const { prefetchMultiple } = usePrefetch();

  // 预取相关文章
  useEffect(() => {
    if (!enablePrefetch || !prefetchHeadings) return;

    // 从内容中提取可能的内部链接
    const linkRegex = /\[([^\]]+)\]\((\/posts\/[^)]+)\)/g;
    const matches: string[] = [];
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      matches.push(match[2]);
    }
    const postLinks = matches.slice(0, 3); // 最多3个

    if (postLinks.length > 0) {
      setRelatedPosts(postLinks);
      prefetchMultiple(postLinks.map(link => `/api/posts${link.replace('/posts/', '')}`));
    }
  }, [content, enablePrefetch, prefetchHeadings, prefetchMultiple]);

  return (
    <div className="relative">
      <LazyTableOfContents
        content={content}
        enableSmoothScroll={enableSmoothScroll}
        delay={delay}
        className={className}
      />
      
      {/* 相关文章预取指示器 */}
      {relatedPosts.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-xs text-blue-700 mb-2">
            <svg className="w-4 h-4 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            已预取 {relatedPosts.length} 篇相关文章
          </div>
        </div>
      )}
    </div>
  );
}