'use client';

import { useAuth } from '@/components/AuthProvider';
import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
import { OptimizedPostList } from '@/components/OptimizedPostCard';
import { LazyLoad } from '@/components/LazyLoading';

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
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg border-b border-gray-200">
      <div className="max-w-full px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center py-8">
          <div className="flex items-center space-x-6">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-1">知识分享博客</h1>
              <p className="text-blue-100 text-lg">个人知识分享空间</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* 用户头像 */}
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">📚</span>
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
      </div>
    </header>
  );
}

function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          <Link 
            href={`/posts/${encodeURIComponent(post.id)}`}
            className="hover:text-indigo-600 transition-colors group"
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
                className="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100"
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
      </div>
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
            <p className="mt-2 text-gray-600">正在加载文章...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <BlogHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">内容准备中</h3>
              <p className="text-gray-600">
                在 <code className="bg-blue-50 px-2 py-1 rounded text-blue-600">posts/</code> 目录中添加 Markdown 文件即可开始分享知识。
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 欢迎横幅 */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">欢迎来到知识分享空间</h2>
                  <p className="text-blue-100">
                    这里记录着学习过程中的思考和总结，希望对你有所帮助。
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🚀</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 文章统计 */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">文章总览</h3>
                  <p className="text-gray-600 text-sm">持续更新中</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{posts.length}</div>
                  <div className="text-sm text-gray-500">篇文章</div>
                </div>
              </div>
            </div>
            
            {/* 文章列表 */}
            <LazyLoad>
              <OptimizedPostList 
                posts={posts}
                enableIntelligentPrefetch={true}
                batchSize={6}
              />
            </LazyLoad>
          </div>
        )}
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">💡 用心分享知识，用技术连接世界</p>
            <p className="text-sm">Built with Next.js & ❤️</p>
          </div>
        </div>
      </footer>
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
          <p className="mt-2 text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <BlogContent />;
}