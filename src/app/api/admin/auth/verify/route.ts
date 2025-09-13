import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getTokenFromCookie } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 开始管理员认证验证API处理...');
    
    // 调试信息 - 详细Cookie状态
    const allCookies = request.cookies.getAll();
    console.log('🍪 所有Cookie:', allCookies.map(c => ({ 
      name: c.name, 
      value: c.value?.substring(0, 20) + '...'
    })));
    
    // 从Cookie中获取token
    const token = getTokenFromCookie(request);
    console.log('🔍 Token获取结果:', !!token, token ? '长度:' + token.length : '无');

    if (!token) {
      console.log('❌ 认证验证失败：未找到Token');
      return NextResponse.json(
        { 
          success: false, 
          error: '未登录', 
          debug: 'no_token_in_cookies',
          request_info: {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries())
          }
        },
        { status: 401 }
      );
    }

    console.log('🔍 开始验证Token...');
    const authResult = requireAuth(request);
    
    if ('error' in authResult) {
      console.log('❌ 认证验证失败:', authResult.error, authResult.debug);
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error, 
          debug: authResult.debug,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    console.log('✅ 认证验证成功，用户:', authResult.username);
    return NextResponse.json({
      success: true,
      user: {
        id: authResult.userId,
        username: authResult.username,
        role: authResult.role
      },
      debug: 'authentication_successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 认证验证API异常:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误', 
        debug: error instanceof Error ? error.message : 'unknown_error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}