import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Debug] 开始认证调试...');

    // 获取所有cookie信息
    const allCookies = request.cookies.getAll();
    console.log('🍪 [Debug] 所有Cookie:', allCookies.map(c => ({
      name: c.name,
      value: c.value?.substring(0, 20) + '...'
    })));

    // 获取特定的admin_token
    const adminToken = request.cookies.get('admin_token');
    console.log('🔑 [Debug] Admin Token:', {
      exists: !!adminToken,
      value: adminToken?.value?.substring(0, 20) + '...',
      length: adminToken?.value?.length
    });

    // 检查请求头
    const headers = Object.fromEntries(request.headers.entries());
    console.log('📋 [Debug] 请求头:', {
      cookie: headers.cookie?.substring(0, 100) + '...',
      userAgent: headers['user-agent']?.substring(0, 100),
      origin: headers.origin,
      referer: headers.referer
    });

    // 返回详细的调试信息
    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        cookies: {
          all: allCookies.map(c => ({
            name: c.name,
            value: c.value?.substring(0, 20) + '...'
          })),
          adminToken: {
            exists: !!adminToken,
            value: adminToken?.value?.substring(0, 20) + '...',
            length: adminToken?.value?.length
          }
        },
        headers: {
          cookie: headers.cookie?.substring(0, 100) + '...',
          userAgent: headers['user-agent']?.substring(0, 100),
          origin: headers.origin,
          referer: headers.referer
        },
        request: {
          url: request.url,
          method: request.method
        }
      }
    });
  } catch (error) {
    console.error('❌ [Debug] 调试API异常:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'unknown_error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}