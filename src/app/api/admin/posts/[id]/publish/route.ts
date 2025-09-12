import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { requireAuth } from '@/lib/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request.headers);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const postId = parseInt(params.id);
    const { is_published } = await request.json();

    if (typeof is_published !== 'boolean') {
      return NextResponse.json(
        { success: false, error: '发布状态必须是布尔值' },
        { status: 400 }
      );
    }

    // 检查文章是否存在
    const existingPost = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    // 更新发布状态
    db.prepare(`
      UPDATE posts 
      SET is_published = ?, 
          published_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      is_published ? 1 : 0,
      is_published ? new Date().toISOString() : null,
      new Date().toISOString(),
      postId
    );

    return NextResponse.json({
      success: true,
      data: { 
        message: is_published ? '文章已发布' : '文章已设为草稿',
        is_published
      }
    });
  } catch (error) {
    console.error('Toggle publish API error:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    );
  }
}