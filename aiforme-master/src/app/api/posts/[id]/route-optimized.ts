import { NextResponse } from 'next/server';
import { getPostData } from '@/lib/posts';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = decodeURIComponent(params.id);

    // 获取文章数据
    const post = await getPostData(postId);
    
    if (!post) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    // 返回文章数据
    return NextResponse.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { success: false, error: '获取文章失败' },
      { status: 500 }
    );
  }
}