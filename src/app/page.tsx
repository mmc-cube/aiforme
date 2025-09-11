'use client';

import { useAuth } from '@/components/AuthProvider';
import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
import { getAllPostsMetadata } from '@/lib/posts';
import { useState, useEffect } from 'react';

interface PostMeta {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  author?: string;
}

function BlogHeader() {
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Knowledge Blog
            </h1>
            <p className="text-gray-600">Personal Knowledge Sharing Space</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          <Link 
            href={`/posts/${post.id}`}
            className="hover:text-indigo-600 transition-colors"
          >
            {post.title}
          </Link>
        </h2>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
          {post.author && (
            <>
              <span className="mx-2">•</span>
              <span>{post.author}</span>
            </>
          )}
        </div>
        
        {post.excerpt && (
          <p className="text-gray-700 leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </div>
      
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
    </article>
  );
}

function BlogContent() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 在客户端获取文章数据
    async function loadPosts() {
      try {
        // 这里需要创建一个API路由来获取文章数据
        const response = await fetch('/api/posts');
        const postsData = await response.json();
        setPosts(postsData);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading posts...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">
              Add some Markdown files to the <code className="bg-gray-100 px-1 py-0.5 rounded">posts/</code> directory to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-lg font-medium text-gray-900">
                Latest Posts ({posts.length})
              </h2>
            </div>
            
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <BlogContent />;
}