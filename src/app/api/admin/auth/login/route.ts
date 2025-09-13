import { NextRequest, NextResponse } from 'next/server';
import { login, COOKIE_OPTIONS } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 开始管理员登录API处理...');
    
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      console.log('❌ 登录失败：缺少用户名或密码');
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空', debug: 'missing_credentials' },
        { status: 400 }
      );
    }

    console.log('🔍 验证用户:', username);
    const result = await login({ username, password });

    if (result.success) {
      console.log('✅ 登录成功，生成认证Cookie...');
      
      // 设置HTTP-only的cookie
      const response = NextResponse.json({
        success: true,
        user: result.user,
        debug: 'cookie_set_successfully'
      });

      // 设置安全的认证cookie
      response.cookies.set('admin_token', result.token!, COOKIE_OPTIONS);

      console.log('🍪 Cookie设置完成，返回响应');
      return response;
    } else {
      console.log('❌ 登录失败:', result.error);
      return NextResponse.json(
        { success: false, error: result.error, debug: 'authentication_failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('❌ Login API异常:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误', 
        debug: error instanceof Error ? error.message : 'unknown_error' 
      },
      { status: 500 }
    );
  }
}