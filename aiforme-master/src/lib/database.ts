import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'blog.db');

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化数据库表
function initDatabase() {
  // 文章表
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      author TEXT DEFAULT '作者',
      tags TEXT, -- JSON格式: ["标签1", "标签2"]
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      sort_order INTEGER DEFAULT 0,
      is_published BOOLEAN DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      featured_image TEXT,
      meta_description TEXT
    );
  `);

  // 访问统计表
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      path TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      city TEXT,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  // 标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      description TEXT,
      post_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 管理员用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 系统配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_sort_order ON posts(sort_order);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON analytics(post_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_accessed_at ON analytics(accessed_at);
  `);

  // 检查是否需要创建默认管理员用户
  try {
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
    if (adminCount.count === 0) {
      const defaultUsername = 'admin';
      const defaultPassword = 'admin123'; // 默认密码，用户应该立即修改
      const hashedPassword = require('bcryptjs').hashSync(defaultPassword, 10);
      
      db.prepare(`
        INSERT INTO admin_users (username, password_hash, email, role)
        VALUES (?, ?, ?, ?)
      `).run(defaultUsername, hashedPassword, 'admin@example.com', 'admin');
      
      console.log('默认管理员用户已创建：admin / admin123');
    }
  } catch (error) {
    // 忽略重复用户错误，可能在并发初始化时发生
    if ((error as any).code !== 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error('创建管理员用户失败:', error);
    }
  }

  console.log('数据库初始化完成');
}

// 初始化数据库
initDatabase();

export default db;

// 数据库操作辅助函数
export function getDb() {
  return db;
}

export function closeDb() {
  db.close();
}

// 事务处理
export function transaction<T>(fn: (db: Database.Database) => T): T {
  return db.transaction(fn)(db);
}

// 错误处理包装器
export function safeQuery<T>(query: string, params: any[] = []): T | null {
  try {
    const stmt = db.prepare(query);
    return stmt.get(...params) as T;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

export function safeQueryAll<T>(query: string, params: any[] = []): T[] {
  try {
    const stmt = db.prepare(query);
    return stmt.all(...params) as T[];
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

export function safeRun(query: string, params: any[] = []): { lastInsertRowid: number; changes: number } | null {
  try {
    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    return {
      lastInsertRowid: Number(result.lastInsertRowid),
      changes: result.changes
    };
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}