import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { requireAuth } from '@/lib/admin-auth';

export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request.headers);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { posts } = await request.json();

    if (!Array.isArray(posts)) {
      return NextResponse.json(
        { success: false, error: '无效的请求数据' },
        { status: 400 }
      );
    }

    // 开始事务
    const transaction = db.transaction(() => {
      posts.forEach((post, index) => {
        const postId = parseInt(post.id);
        if (isNaN(postId)) {
          throw new Error(`无效的文章ID: ${post.id}`);
        }

        // 更新文章排序
        db.prepare(`
          UPDATE posts 
          SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(index, postId);
      });
    });

    try {
      transaction();
      console.log(`成功更新 ${posts.length} 篇文章的排序`);
    } catch (error) {
      console.error('更新文章排序失败:', error);
      return NextResponse.json(
        { success: false, error: '更新排序失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `成功更新 ${posts.length} 篇文章的排序`,
      data: {
        updatedCount: posts.length
      }
    });
  } catch (error) {
    console.error('Update post order API error:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}