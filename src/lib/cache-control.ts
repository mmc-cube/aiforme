import { NextResponse } from 'next/server';

/**
 * 缓存中间件
 * 为Next.js API路由添加缓存控制头
 */
export function withCache(
  handler: (req: Request, context: any) => Promise<NextResponse>,
  options: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    mustRevalidate?: boolean;
    private?: boolean;
  } = {}
) {
  const {
    maxAge = 60, // 1分钟默认缓存
    sMaxAge = 600, // 10分钟CDN缓存
    staleWhileRevalidate = 86400, // 24小时后台刷新
    mustRevalidate = true,
    private = false
  } = options;

  return async (req: Request, context: any) => {
    const response = await handler(req, context);

    // 添加缓存控制头
    const cacheDirectives = [
      private ? 'private' : 'public',
      `max-age=${maxAge}`,
      `s-maxage=${sMaxAge}`,
      `stale-while-revalidate=${staleWhileRevalidate}`,
    ];

    if (mustRevalidate) {
      cacheDirectives.push('must-revalidate');
    }

    response.headers.set('Cache-Control', cacheDirectives.join(', '));
    
    // 添加ETag支持
    const etag = generateETag(await response.text());
    response.headers.set('ETag', etag);

    // 处理If-None-Match请求
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return response;
  };
}

/**
 * 生成ETag
 */
function generateETag(content: string): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(content).digest('hex');
  return `"${hash}"`;
}

/**
 * 静态资源缓存控制
 */
export const staticAssetCache = {
  // CSS/JS文件 - 长期缓存
  scripts: 'public, max-age=31536000, immutable',
  
  // 图片文件 - 长期缓存
  images: 'public, max-age=31536000, immutable',
  
  // 字体文件 - 长期缓存
  fonts: 'public, max-age=31536000, immutable',
  
  // API响应 - 短期缓存
  api: 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400, must-revalidate',
  
  // HTML页面 - 不缓存
  html: 'no-cache, no-store, must-revalidate',
};

/**
 * Service Worker缓存策略
 */
export const swCacheStrategies = {
  // 预缓存核心资源
  precache: [
    '/',
    '/api/posts',
    '/static/js/main.js',
    '/static/css/main.css',
  ],

  // 网络优先策略
  networkFirst: [
    '/api/posts/*',
    '/api/tags/*',
  ],

  // 缓存优先策略
  cacheFirst: [
    '/static/*',
    '/images/*',
  ],

  // 仅网络策略
  networkOnly: [
    '/api/auth/*',
  ],
};

/**
 * 生成Cache-Control头
 */
export function generateCacheControl(options: {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  private?: boolean;
  immutable?: boolean;
} = {}): string {
  const directives: string[] = [];

  if (options.noStore) {
    directives.push('no-store');
  } else if (options.noCache) {
    directives.push('no-cache');
  } else {
    directives.push(options.private ? 'private' : 'public');
    
    if (options.maxAge) {
      directives.push(`max-age=${options.maxAge}`);
    }
    
    if (options.sMaxAge) {
      directives.push(`s-maxage=${options.sMaxAge}`);
    }
    
    if (options.staleWhileRevalidate) {
      directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }
    
    if (options.immutable) {
      directives.push('immutable');
    }
    
    if (options.mustRevalidate) {
      directives.push('must-revalidate');
    }
  }

  return directives.join(', ');
}