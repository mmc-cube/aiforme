'use client';

import { useEffect, useState, useCallback } from 'react';
import { prefetchManager, usePrefetch } from '@/lib/prefetch';
import Link from 'next/link';

interface OptimizedPostCardProps {
  post: {
    id: string;
    title: string;
    date: string;
    excerpt?: string;
    tags?: string[];
    author?: string;
  };
  className?: string;
  enablePrefetch?: boolean;
}

/**
 * 优化的文章卡片组件
 * 支持智能预取和加载状态
 */
export function OptimizedPostCard({ 
  post, 
  className = '',
  enablePrefetch = true 
}: OptimizedPostCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [prefetchTriggered, setPrefetchTriggered] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const { prefetch } = usePrefetch();

  const postUrl = `/posts/${encodeURIComponent(post.id)}`;

  // 检查缓存状态
  useEffect(() => {
    const checkCache = () => {
      const cached = prefetchManager.getFromCache(`/api/posts/${post.id}`);
      setIsCached(!!cached);
    };

    checkCache();
    const interval = setInterval(checkCache, 1000);
    return () => clearInterval(interval);
  }, [post.id]);

  // 鼠标悬停预取
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    
    if (enablePrefetch && !prefetchTriggered) {
      const prefetchDelay = isCached ? 1000 : 300; // 已缓存则延迟预取
      
      const timer = setTimeout(() => {
        prefetch(`/api/posts/${post.id}`);
        setPrefetchTriggered(true);
      }, prefetchDelay);
      
      return () => clearTimeout(timer);
    }
  }, [enablePrefetch, prefetchTriggered, isCached, post.id, prefetch]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <article 
      className={`bg-white rounded-xl shadow-md border border-gray-100 p-6 
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1 
        group relative overflow-hidden ${className}
        ${isCached ? 'ring-2 ring-green-100' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 缓存状态指示器 */}
      {isCached && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>已缓存</span>
          </div>
        </div>
      )}

      {/* 悬停状态指示器 */}
      {isHovering && !isCached && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <span>预取中...</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          <Link 
            href={postUrl}
            className="hover:text-indigo-600 transition-colors group"
            prefetch={enablePrefetch}
          >
            {post.title}
            <span className="block h-0.5 bg-indigo-200 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 mt-1"></span>
          </Link>
        </h2>
        
        {post.excerpt && (
          <p className="text-gray-600 leading-relaxed text-sm">
            {post.excerpt}
          </p>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 
                  text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100"
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 预取进度 */}
        {isHovering && !isCached && (
          <div className="flex items-center space-x-2">
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

interface OptimizedPostListProps {
  posts: Array<{
    id: string;
    title: string;
    date: string;
    excerpt?: string;
    tags?: string[];
    author?: string;
  }>;
  enableIntelligentPrefetch?: boolean;
  batchSize?: number;
  className?: string;
}

/**
 * 优化的文章列表组件
 * 支持智能预取和虚拟滚动
 */
export function OptimizedPostList({ 
  posts, 
  enableIntelligentPrefetch = true,
  batchSize = 6,
  className = ''
}: OptimizedPostListProps) {
  const { intelligentPrefetch } = usePrefetch();
  const [visiblePosts, setVisiblePosts] = useState(batchSize);

  // 智能预取
  useEffect(() => {
    if (enableIntelligentPrefetch) {
      const timer = setTimeout(() => {
        intelligentPrefetch();
      }, 2000); // 页面加载2秒后开始智能预取

      return () => clearTimeout(timer);
    }
  }, [enableIntelligentPrefetch, intelligentPrefetch]);

  // 无限滚动
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 1000) {
        setVisiblePosts(prev => Math.min(prev + batchSize, posts.length));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts.length, batchSize]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {posts.slice(0, visiblePosts).map((post) => (
          <OptimizedPostCard
            key={post.id}
            post={post}
            enablePrefetch={enableIntelligentPrefetch}
          />
        ))}
      </div>

      {/* 加载更多指示器 */}
      {visiblePosts < posts.length && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm">加载更多文章...</span>
          </div>
        </div>
      )}
    </div>
  );
}