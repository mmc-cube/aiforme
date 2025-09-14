import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { requireAuth } from '@/lib/admin-auth';
import matter from 'gray-matter';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = requireAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      return NextResponse.json(
        { success: false, error: '只支持Markdown文件(.md, .markdown)' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const content = Buffer.from(bytes).toString('utf-8');

    // 解析Markdown文件
    const matterResult = matter(content);
    const metadata = matterResult.data;
    const bodyContent = matterResult.content;

    // 生成slug（如果没有标题则用文件名）
    const title = metadata.title || file.name.replace(/\.(md|markdown)$/, '');
    let slug = metadata.slug || '';
    
    if (!slug) {
      // 从标题生成slug
      slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // 移除特殊字符
        .replace(/\s+/g, '-') // 空格替换为连字符
        .replace(/-+/g, '-') // 多个连字符合并为一个
        .trim();
    }

    // 确保slug唯一
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existing = db.prepare('SELECT id FROM posts WHERE slug = ?').get(finalSlug);
      if (!existing) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // 获取最大的sort_order
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM posts').get() as { max_order: number };
    const sortOrder = (maxOrder.max_order || 0) + 1;

    // 插入到数据库
    const result = db.prepare(`
      INSERT INTO posts (
        slug, title, content, excerpt, author, tags, 
        is_published, sort_order, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalSlug,
      title,
      bodyContent,
      metadata.excerpt || '',
      metadata.author || '作者',
      JSON.stringify(metadata.tags || []),
      metadata.published !== false ? 1 : 0,
      sortOrder,
      metadata.published !== false ? new Date().toISOString() : null
    );

    // 可选：保存原始文件到uploads目录
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadsDir, fileName);
      
      await writeFile(filePath, Buffer.from(bytes));
      
      console.log(`Original file saved to: ${filePath}`);
    } catch (error) {
      console.warn('Failed to save original file:', error);
      // 不影响主流程，继续执行
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        slug: finalSlug,
        title,
        message: '文件上传成功'
      }
    });
  } catch (error) {
    console.error('File upload API error:', error);
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    );
  }
}