import { SignJWT } from 'jose';

// 纯Node.js实现，不依赖Next.js
export default {
  async handler(event) {
    try {
      const { code } = JSON.parse(event.body);
      const validCodes = process.env.INVITE_CODES?.split(',').map(c => c.trim()) || [];
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, error: 'Server configuration error' })
        };
      }
      
      if (!validCodes.includes(code)) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, error: 'Invalid invite code' })
        };
      }
      
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
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          token,
          message: 'Access granted successfully'
        })
      };
      
    } catch (error) {
      console.error('Verification error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Internal server error' 
        })
      };
    }
  }
};