import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'temporary-secret-key-for-testing';
const TOKEN_KEY = 'knowledge-blog-token';

export class AuthService {
  
  /**
   * 验证邀请码
   */
  static async verifyInviteCode(code: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // 首先尝试Netlify Functions
      const response = await fetch('/netlify/functions/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        // 如果Functions不可用，使用本地备用验证
        return await this.verifyInviteCodeFallback(code);
      }
    } catch (error) {
      // 网络错误时使用备用验证
      return await this.verifyInviteCodeFallback(code);
    }
  }

  /**
   * 备用邀请码验证（本地）
   */
  static async verifyInviteCodeFallback(code: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // 本地备用邀请码（用于测试）
      const fallbackCodes = ['welcome123', 'demo456', 'test789', 'nimiai'];
      const jwtSecret = process.env.JWT_SECRET || 'temporary-secret-key-for-testing';
      
      if (!fallbackCodes.includes(code)) {
        return { 
          success: false, 
          error: '邀请码无效' 
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
        success: true,
        token,
        error: undefined
      };
    } catch (error) {
      return { 
        success: false, 
        error: '验证失败，请稍后重试' 
      };
    }
  }
  
  /**
   * 保存认证token到localStorage和sessionStorage
   */
  static saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(TOKEN_KEY, token);
      console.log('Auth: Token saved to storage');
    }
  }
  
  /**
   * 从localStorage获取token，如果没有则尝试sessionStorage
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        token = sessionStorage.getItem(TOKEN_KEY);
        if (token) {
          // 如果sessionStorage有token，恢复到localStorage
          localStorage.setItem(TOKEN_KEY, token);
        }
      }
      return token;
    }
    return null;
  }
  
  /**
   * 验证当前token是否有效
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) {
      console.log('Auth: No token found');
      return false;
    }
    
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      // 检查token是否包含必要信息
      const isValid = payload.verified === true;
      console.log('Auth: Token validation result:', isValid);
      return isValid;
    } catch (error) {
      console.log('Auth: Token validation failed:', error);
      // Token无效或过期，清除本地存储
      this.clearToken();
      return false;
    }
  }
  
  /**
   * 清除认证token
   */
  static clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      console.log('Auth: Token cleared from storage');
    }
  }
  
  /**
   * 获取token中的信息
   */
  static async getTokenInfo(): Promise<any> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }
    
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch (error) {
      return null;
    }
  }
}