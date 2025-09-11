import { NextResponse } from 'next/server';
import { getAllPostsMetadata } from '@/lib/posts';

export async function GET() {
  try {
    const posts = getAllPostsMetadata();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: '获取文章失败' },
      { status: 500 }
    );
  }
}