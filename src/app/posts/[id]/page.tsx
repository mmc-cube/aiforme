'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface PostData {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  author?: string;
  contentHtml?: string;
}

function BlogHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              ← 返回首页
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                知识分享博客
              </h1>
              <p className="text-gray-600">个人知识分享空间</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            退出登录
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
        dangerouslySetInnerHTML={{ __html: post.contentHtml }} 
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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <PostContent post={post} />
        </div>
      </main>
    </div>
  );
}

export default function PostPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
    // 使用 useEffect 重定向，避免在渲染过程中导航
    useEffect(() => {
      router.push('/');
    }, [router]);
    
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