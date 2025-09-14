import { NextResponse } from 'next/server';
import { getPostData } from '@/lib/posts';
import { markdownOptimizer } from '@/lib/markdown-optimizer';
import { Cache } from '@/lib/cache';

// 创建API专用的缓存实例
const apiCache = new Cache({
  maxSize: 50,
  ttl: 10 * 60 * 1000, // 10分钟缓存
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = decodeURIComponent(params.id);
    const cacheKey = `post-${postId}`;

    // 检查缓存
    const cached = apiCache.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(cached);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'public, max-age=600');
      return response;
    }

    // 获取文章数据
    const post = await getPostData(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }

    // 异步优化Markdown内容（不阻塞响应）
    if (post.content && !post.contentHtml) {
      // 立即返回基本内容，后台处理HTML
      const response = NextResponse.json(post);
      response.headers.set('X-Cache', 'MISS');
      response.headers.set('Cache-Control', 'public, max-age=600');
      
      // 后台处理HTML
      markdownOptimizer.processMarkdown(post.content, postId).catch(error => {
        console.error('Background markdown processing failed:', error);
      });

      return response;
    }

    // 缓存结果
    apiCache.set(cacheKey, post);

    const response = NextResponse.json(post);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=600');
    return response;
    
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: '获取文章失败' },
      { status: 500 }
    );
  }
}