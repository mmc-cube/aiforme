import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { requireAuth } from '@/lib/admin-auth';

// 获取所有标签
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request.headers);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    // 获取查询参数
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get('search') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // 构建查询
    let query = 'SELECT * FROM tags';
    let countQuery = 'SELECT COUNT(*) as total FROM tags';
    const params: any[] = [];

    if (search) {
      query += ' WHERE name LIKE ? OR description LIKE ?';
      countQuery += ' WHERE name LIKE ? OR description LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY post_count DESC, name ASC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    // 获取标签列表
    const tags = db.prepare(query).all(...params) as any[];
    
    // 获取总数
    const totalResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = totalResult.total;

    // 获取每个标签的文章数
    const tagsWithCount = tags.map(tag => {
      const postCount = db.prepare('SELECT COUNT(*) as count FROM post_tags WHERE tag_id = ?').get(tag.id) as { count: number };
      return {
        ...tag,
        post_count: postCount.count
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        tags: tagsWithCount,
        pagination: {
          current: pageNum,
          total: Math.ceil(total / limitNum),
          pageSize: limitNum,
          totalItems: total
        }
      }
    });
  } catch (error) {
    console.error('Get tags API error:', error);
    return NextResponse.json(
      { success: false, error: '获取标签列表失败' },
      { status: 500 }
    );
  }
}

// 创建新标签
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request.headers);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { name, description, color = '#3B82F6' } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: '标签名称不能为空' },
        { status: 400 }
      );
    }

    // 检查标签是否已存在
    const existingTag = db.prepare('SELECT id FROM tags WHERE name = ?').get(name.trim());
    if (existingTag) {
      return NextResponse.json(
        { success: false, error: '标签已存在' },
        { status: 400 }
      );
    }

    // 创建标签
    const result = db.prepare(`
      INSERT INTO tags (name, description, color, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(name.trim(), description || '', color);

    const newTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      success: true,
      message: '标签创建成功',
      data: newTag
    });
  } catch (error) {
    console.error('Create tag API error:', error);
    return NextResponse.json(
      { success: false, error: '创建标签失败' },
      { status: 500 }
    );
  }
}