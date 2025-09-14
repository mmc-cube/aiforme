'use client';

import { useState, useEffect } from 'react';
import { PostData } from '@/types/admin';

interface PostOrderProps {
  posts: PostData[];
  onOrderChange: (newOrder: PostData[]) => void;
  isLoading?: boolean;
}

export function PostOrder({ posts, onOrderChange, isLoading = false }: PostOrderProps) {
  const [orderedPosts, setOrderedPosts] = useState<PostData[]>([]);

  useEffect(() => {
    setOrderedPosts(posts);
  }, [posts]);

  const movePost = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedPosts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setOrderedPosts(newOrder);
      onOrderChange(newOrder);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">文章排序控制</h3>
      <p className="text-sm text-gray-600 mb-4">
        使用上下按钮调整文章在首页的显示顺序
      </p>

      <div className="space-y-3">
        {orderedPosts.map((post, index) => (
          <div
            key={post.id.toString()}
            className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            {/* 顺序编号 */}
            <div className="flex-shrink-0 mr-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
            </div>

            {/* 文章信息 */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {post.title}
              </h4>
              <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                <span>排序: {post.sort_order || 999}</span>
                {post.is_published && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    已发布
                  </span>
                )}
                {!post.is_published && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    草稿
                  </span>
                )}
                {post.tags && post.tags.length > 0 && (
                  <span>{post.tags.length} 个标签</span>
                )}
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex-shrink-0 ml-4 flex space-x-2">
              <button
                onClick={() => movePost(index, 'up')}
                disabled={index === 0}
                className={`p-2 rounded-md ${
                  index === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                }`}
                title="上移"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => movePost(index, 'down')}
                disabled={index === orderedPosts.length - 1}
                className={`p-2 rounded-md ${
                  index === orderedPosts.length - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                }`}
                title="下移"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* 访问量 */}
            <div className="flex-shrink-0 ml-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {post.view_count || 0}
                </div>
                <div className="text-xs text-gray-500">访问量</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orderedPosts.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无文章</h3>
          <p className="mt-1 text-sm text-gray-500">请先上传一些文章</p>
        </div>
      )}
    </div>
  );
}