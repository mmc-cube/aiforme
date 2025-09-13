import { NextResponse } from 'next/server';
import { COOKIE_OPTIONS } from '@/lib/admin-auth';

export async function POST() {
  try {
    console.log('🚪 开始管理员登出API处理...');
    
    const response = NextResponse.json({ 
      success: true,
      debug: 'logout_successful',
      timestamp: new Date().toISOString()
    });
    
    // 清除认证cookie（使用与设置时相同的配置）
    response.cookies.set('admin_token', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0) // 立即过期
    });

    console.log('🍪 认证Cookie已清除');
    return response;
  } catch (error) {
    console.error('❌ 登出API异常:', error);
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