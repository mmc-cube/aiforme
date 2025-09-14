import { NextResponse } from 'next/server';
import { getAllPostsMetadata } from '@/lib/posts';

export async function GET() {
  try {
    const posts = getAllPostsMetadata();
    
    const response = NextResponse.json(posts);
    response.headers.set('Cache-Control', 'public, max-age=300');
    response.headers.set('X-Cache', 'MISS');
    
    return response;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: '获取文章失败' },
      { status: 500 }
    );
  }
}