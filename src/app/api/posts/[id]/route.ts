import { NextResponse } from 'next/server';
import { getPostData } from '@/lib/posts';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = decodeURIComponent(params.id);
    const post = await getPostData(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: '获取文章失败' },
      { status: 500 }
    );
  }
}