import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // 从cookie中获取token
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '无效的认证令牌' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        username: payload.username,
        role: payload.role
      }
    });
  } catch (error) {
    console.error('Verify auth API error:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}