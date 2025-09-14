import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { requireAuth } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const postId = parseInt(params.id);

    // 获取文章
    const post = db.prepare(`
      SELECT id, slug, title, content, excerpt, author, tags, 
             created_at, updated_at, is_published, sort_order, 
             view_count, featured_image, meta_description
      FROM posts WHERE id = ?
    `).get(postId);

    if (!post) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    // 处理标签字段
    const processedPost = {
      ...(post as any),
      tags: (post as any).tags ? JSON.parse((post as any).tags) : []
    };

    return NextResponse.json({
      success: true,
      data: processedPost
    });
  } catch (error) {
    console.error('Get post API error:', error);
    return NextResponse.json(
      { success: false, error: '获取文章失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const postId = parseInt(params.id);
    const data = await request.json();

    const {
      slug,
      title,
      content,
      excerpt,
      author,
      tags = [],
      is_published,
      sort_order,
      featured_image,
      meta_description
    } = data;

    // 检查文章是否存在
    const existingPost = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    // 检查slug是否与其他文章冲突
    if (slug) {
      const slugCheck = db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, postId);
      if (slugCheck) {
        return NextResponse.json(
          { success: false, error: 'URL别名已存在' },
          { status: 400 }
        );
      }
    }

    // 构建更新语句
    const updateFields = [];
    const updateValues = [];

    if (slug !== undefined) {
      updateFields.push('slug = ?');
      updateValues.push(slug);
    }
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (excerpt !== undefined) {
      updateFields.push('excerpt = ?');
      updateValues.push(excerpt);
    }
    if (author !== undefined) {
      updateFields.push('author = ?');
      updateValues.push(author);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(tags));
    }
    if (is_published !== undefined) {
      updateFields.push('is_published = ?');
      updateValues.push(is_published ? 1 : 0);
      
      // 如果发布状态改变，更新发布时间
      if (is_published) {
        updateFields.push('published_at = ?');
        updateValues.push(new Date().toISOString());
      }
    }
    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      updateValues.push(sort_order);
    }
    if (featured_image !== undefined) {
      updateFields.push('featured_image = ?');
      updateValues.push(featured_image);
    }
    if (meta_description !== undefined) {
      updateFields.push('meta_description = ?');
      updateValues.push(meta_description);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有要更新的字段' },
        { status: 400 }
      );
    }

    // 添加更新时间
    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());

    // 添加文章ID
    updateValues.push(postId);

    // 执行更新
    const updateQuery = `
      UPDATE posts 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(...updateValues);

    return NextResponse.json({
      success: true,
      data: { message: '文章更新成功' }
    });
  } catch (error) {
    console.error('Update post API error:', error);
    return NextResponse.json(
      { success: false, error: '更新文章失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const postId = parseInt(params.id);

    // 检查文章是否存在
    const existingPost = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    // 删除文章
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    return NextResponse.json({
      success: true,
      data: { message: '文章删除成功' }
    });
  } catch (error) {
    console.error('Delete post API error:', error);
    return NextResponse.json(
      { success: false, error: '删除文章失败' },
      { status: 500 }
    );
  }
}