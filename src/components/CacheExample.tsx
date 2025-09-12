'use client';

import { useState, useEffect } from 'react';
import CacheDashboard from '@/components/CacheDashboard';

// 示例：使用缓存的组件
export default function CacheExample() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      
      // 检查是否来自缓存
      setCached(data._cached || false);
      setPosts(data.data || data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">缓存示例</h1>
      
      {/* 缓存状态提示 */}
      <div className={`p-4 rounded ${cached ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
        {cached ? '✓ 数据来自缓存' : '⚡ 数据已更新（缓存未命中）'}
      </div>

      {/* 缓存仪表板（仅在开发环境显示） */}
      {process.env.NODE_ENV === 'development' && (
        <CacheDashboard />
      )}

      {/* 文章列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">文章列表</h2>
        {posts.length > 0 ? (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="p-3 border rounded">
                <h3 className="font-medium">{post.title}</h3>
                <p className="text-sm text-gray-600">{post.date}</p>
                {post.excerpt && (
                  <p className="text-sm mt-1">{post.excerpt}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无文章</p>
        )}
      </div>

      {/* 刷新按钮 */}
      <button
        onClick={fetchPosts}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        刷新数据
      </button>
    </div>
  );
}