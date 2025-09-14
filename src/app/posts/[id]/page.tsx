'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { EnhancedTableOfContents } from '@/components/LazyTableOfContents';
import { processHtmlContentLegacy as processHtmlContent } from '@/lib/heading-utils';
import { LazyLoad } from '@/components/LazyLoading';

interface PostData {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  author?: string;
  contentHtml?: string;
  content?: string;
}

function BlogHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg border-b border-gray-200">
      <div className="max-w-full px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center py-8">
          <div className="flex items-center space-x-6">
            <Link 
              href="/"
              className="text-white/90 hover:text-white transition-colors flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>返回首页</span>
            </Link>
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-1">知识分享博客</h1>
              <p className="text-blue-100 text-lg">个人知识分享空间</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-white/80 hover:text-white transition-colors flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function PostContent({ post }: { post: PostData }) {
  if (!post.contentHtml) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">文章内容无法加载</h3>
        <p className="text-gray-600 mb-4">
          文章内容可能正在处理中，请稍后再试。
        </p>
        <Link 
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          返回首页
        </Link>
      </div>
    );
  }

  // 使用统一的函数处理HTML内容
  const processedHtml = processHtmlContent(post.contentHtml);

  return (
    <article className="prose prose-lg max-w-none">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div 
        className="prose prose-lg max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-p:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processedHtml }} 
      />
    </article>
  );
}

function BlogContent() {
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // 如果没有认证，重定向到首页
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    async function loadPost() {
      try {
        const postId = params.id as string;
        const response = await fetch(`/api/posts/${postId}`);
        
        if (response.ok) {
          const postData = await response.json();
          setPost(postData);
        } else if (response.status === 404) {
          setError('文章不存在');
        } else {
          setError('加载文章失败');
        }
      } catch (error) {
        console.error('Failed to load post:', error);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [params.id, isAuthenticated, router]);

  // 移除hash导航功能，仅保留滚动高亮

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">正在加载文章...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || '文章不存在'}
            </h3>
            <p className="text-gray-600 mb-4">
              抱歉，无法找到您要访问的文章。
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              返回首页
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <main className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 左侧目录 */}
          {post.content && (
            <LazyLoad delay={500}>
              <EnhancedTableOfContents 
                content={post.content}
                enableSmoothScroll={true}
                enablePrefetch={true}
              />
            </LazyLoad>
          )}
          
          {/* 主要内容区域 */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <PostContent post={post} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PostPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // 处理重定向逻辑
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  return <BlogContent />;
}