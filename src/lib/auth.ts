import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const TOKEN_KEY = 'knowledge-blog-token';

export class AuthService {
  
  /**
   * 验证邀请码
   */
  static async verifyInviteCode(code: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const response = await fetch('/netlify/functions/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: 'Network error' 
      };
    }
  }
  
  /**
   * 保存认证token到localStorage
   */
  static saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }
  
  /**
   * 从localStorage获取token
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }
  
  /**
   * 验证当前token是否有效
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }
    
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      // 检查token是否包含必要信息
      return payload.verified === true;
    } catch (error) {
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