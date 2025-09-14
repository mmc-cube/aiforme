'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PostData } from '@/types/admin';
import { PostOrder } from '@/components/admin/PostOrder';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/components/admin/AuthProvider';

export default function PostOrderPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }

    if (user) {
      fetchPosts();
    }
  }, [user, authLoading, router]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/posts');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 按sort_order排序
          const sortedPosts = data.data.sort((a: PostData, b: PostData) => 
            (a.sort_order || 999) - (b.sort_order || 999)
          );
          setPosts(sortedPosts);
        } else {
          setMessage({ type: 'error', text: data.error || '获取文章列表失败' });
        }
      } else {
        setMessage({ type: 'error', text: '网络错误，请重试' });
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setMessage({ type: 'error', text: '获取文章列表失败' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderChange = async (newOrder: PostData[]) => {
    // 立即更新UI
    setPosts(newOrder);

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/posts/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts: newOrder }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: data.message });
        } else {
          setMessage({ type: 'error', text: data.error || '更新排序失败' });
          // 失败时恢复原顺序
          fetchPosts();
        }
      } else {
        setMessage({ type: 'error', text: '网络错误，请重试' });
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      setMessage({ type: 'error', text: '更新排序失败' });
      fetchPosts();
    } finally {
      setIsSaving(false);
      // 3秒后清除消息
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">文章排序</h1>
            <p className="mt-1 text-sm text-gray-600">
              拖拽调整文章在首页的显示顺序
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/admin/posts')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              返回文章管理
            </button>
            <button
              onClick={fetchPosts}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  刷新中...
                </>
              ) : (
                '刷新列表'
              )}
            </button>
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 保存状态指示器 */}
        {isSaving && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  正在保存排序...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 排序组件 */}
        <PostOrder
          posts={posts}
          onOrderChange={handleOrderChange}
          isLoading={isLoading}
        />

        {/* 使用说明 */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800">使用说明</h3>
              <div className="mt-2 text-sm text-indigo-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>拖拽文章左侧的图标来调整显示顺序</li>
                  <li>排序会自动保存，无需手动点击保存按钮</li>
                  <li>序号越小的文章在首页显示越靠前</li>
                  <li>如果文章数量很多，建议分批调整排序</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}