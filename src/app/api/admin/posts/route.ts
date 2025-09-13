import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { requireAuth } from '@/lib/admin-auth';
import matter from 'gray-matter';

export interface PostData {
  id?: number;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  tags?: string[];
  is_published?: boolean;
  sort_order?: number;
  featured_image?: string;
  meta_description?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';

    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tag) {
      whereClause += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM posts ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult.total;

    // 获取文章列表
    const postsQuery = `
      SELECT id, slug, title, excerpt, author, tags, created_at, updated_at, 
             is_published, sort_order, view_count, featured_image
      FROM posts ${whereClause}
      ORDER BY sort_order DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const posts = db.prepare(postsQuery).all(...params, limit, offset);

    // 处理标签字段（从JSON字符串转换为数组）
    const processedPosts = posts.map((post: any) => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : []
    }));

    return NextResponse.json({
      success: true,
      data: {
        posts: processedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get posts API error:', error);
    return NextResponse.json(
      { success: false, error: '获取文章列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const data = await request.json();
    const {
      slug,
      title,
      content,
      excerpt,
      author = '作者',
      tags = [],
      is_published = true,
      sort_order = 0,
      featured_image,
      meta_description
    }: PostData = data;

    // 验证必填字段
    if (!slug || !title || !content) {
      return NextResponse.json(
        { success: false, error: '标题、内容和URL别名不能为空' },
        { status: 400 }
      );
    }

    // 检查slug是否已存在
    const existingPost = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
    if (existingPost) {
      return NextResponse.json(
        { success: false, error: 'URL别名已存在' },
        { status: 400 }
      );
    }

    // 获取最大的sort_order
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM posts').get() as { max_order: number };
    const finalSortOrder = sort_order || (maxOrder.max_order || 0) + 1;

    // 插入文章
    const result = db.prepare(`
      INSERT INTO posts (
        slug, title, content, excerpt, author, tags, 
        is_published, sort_order, featured_image, meta_description,
        published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      slug,
      title,
      content,
      excerpt,
      author,
      JSON.stringify(tags),
      is_published ? 1 : 0,
      finalSortOrder,
      featured_image,
      meta_description,
      is_published ? new Date().toISOString() : null
    );

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '文章创建成功'
      }
    });
  } catch (error) {
    console.error('Create post API error:', error);
    return NextResponse.json(
      { success: false, error: '创建文章失败' },
      { status: 500 }
    );
  }
}