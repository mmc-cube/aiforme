import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { requireAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    // 获取统计数据
    const stats = {
      totalPosts: 0,
      publishedPosts: 0,
      totalViews: 0,
      totalTags: 0,
      recentPosts: [] as any[]
    };

    // 总文章数
    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
    stats.totalPosts = postCount.count;

    // 已发布文章数
    const publishedCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE is_published = 1').get() as { count: number };
    stats.publishedPosts = publishedCount.count;

    // 总浏览量
    const totalViews = db.prepare('SELECT SUM(view_count) as total FROM posts').get() as { total: number };
    stats.totalViews = totalViews.total || 0;

    // 标签数
    const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
    stats.totalTags = tagCount.count;

    // 最近文章
    const recentPosts = db.prepare(`
      SELECT id, title, created_at, is_published, view_count
      FROM posts 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all() as any[];

    stats.recentPosts = recentPosts;

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}