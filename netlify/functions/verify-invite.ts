import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    // 从环境变量获取有效邀请码列表
    const validCodes = process.env.INVITE_CODES?.split(',').map(c => c.trim()) || [];
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // 验证邀请码
    if (!validCodes.includes(code)) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite code' },
        { status: 401 }
      );
    }
    
    // 生成JWT token (30天有效期)
    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({ 
      verified: true,
      codeUsed: code,
      timestamp: Date.now()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);
    
    return NextResponse.json({
      success: true,
      token,
      message: 'Access granted successfully'
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}