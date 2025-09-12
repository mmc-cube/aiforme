import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  last_login?: string;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * 管理员登录
 */
export async function login(credentials: LoginCredentials): Promise<{
  success: boolean;
  user?: AdminUser;
  token?: string;
  error?: string;
}> {
  try {
    // 查找用户
    const user = db.prepare(`
      SELECT id, username, email, password_hash, role, last_login, created_at
      FROM admin_users 
      WHERE username = ?
    `).get(credentials.username) as AdminUser & { password_hash: string } | undefined;

    if (!user) {
      return { success: false, error: '用户名或密码错误' };
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      return { success: false, error: '用户名或密码错误' };
    }

    // 生成JWT令牌
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    // 更新最后登录时间
    db.prepare(`
      UPDATE admin_users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(user.id);

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: '登录过程中发生错误' };
  }
}

/**
 * 验证JWT令牌
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * 从请求头中获取JWT令牌
 */
export function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * 验证管理员权限的中间件函数
 */
export function requireAuth(headers: Headers): JwtPayload | { error: string } {
  const token = getTokenFromHeaders(headers);
  if (!token) {
    return { error: '缺少认证令牌' };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: '无效的认证令牌' };
  }

  return payload;
}

/**
 * 修改管理员密码
 */
export async function changePassword(
  userId: number, 
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 获取用户当前密码
    const user = db.prepare(`
      SELECT password_hash FROM admin_users WHERE id = ?
    `).get(userId) as { password_hash: string } | undefined;

    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    // 验证当前密码
    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return { success: false, error: '当前密码错误' };
    }

    // 哈希新密码
    const newHashedPassword = bcrypt.hashSync(newPassword, 10);

    // 更新密码
    db.prepare(`
      UPDATE admin_users SET password_hash = ? WHERE id = ?
    `).run(newHashedPassword, userId);

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: '修改密码失败' };
  }
}

/**
 * 创建新的管理员用户
 */
export async function createAdminUser(
  username: string,
  password: string,
  email?: string,
  role: string = 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 检查用户名是否已存在
    const existingUser = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username);
    if (existingUser) {
      return { success: false, error: '用户名已存在' };
    }

    // 哈希密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 创建用户
    db.prepare(`
      INSERT INTO admin_users (username, password_hash, email, role)
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, email, role);

    return { success: true };
  } catch (error) {
    console.error('Create admin user error:', error);
    return { success: false, error: '创建用户失败' };
  }
}

/**
 * 获取所有管理员用户
 */
export function getAdminUsers(): AdminUser[] {
  try {
    return db.prepare(`
      SELECT id, username, email, role, last_login, created_at
      FROM admin_users 
      ORDER BY created_at DESC
    `).all() as AdminUser[];
  } catch (error) {
    console.error('Get admin users error:', error);
    return [];
  }
}

/**
 * 删除管理员用户
 */
export async function deleteAdminUser(userId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // 防止删除最后一个管理员
    const userCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
    if (userCount.count <= 1) {
      return { success: false, error: '不能删除最后一个管理员用户' };
    }

    db.prepare('DELETE FROM admin_users WHERE id = ?').run(userId);
    return { success: true };
  } catch (error) {
    console.error('Delete admin user error:', error);
    return { success: false, error: '删除用户失败' };
  }
}