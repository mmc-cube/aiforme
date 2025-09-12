const CACHE_NAME = 'knowledge-blog-v1';
const API_CACHE_NAME = 'api-cache-v1';

// 需要预缓存的资源
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
];

// API路由模式
const API_PATTERNS = [
  '/api/posts',
  '/api/tags',
];

// 静态资源模式
const STATIC_PATTERNS = [
  '/static/',
  '/images/',
  '/fonts/',
];

/**
 * 安装Service Worker并预缓存资源
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/**
 * 激活Service Worker并清理旧缓存
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * 拦截网络请求
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非HTTP请求
  if (!request.url.startsWith('http')) {
    return;
  }

  // 处理API请求
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 处理静态资源
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // 处理导航请求
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // 默认网络优先
  event.respondWith(networkFirstStrategy(request));
});

/**
 * 判断是否为API请求
 */
function isApiRequest(url: URL): boolean {
  return API_PATTERNS.some(pattern => url.pathname.startsWith(pattern));
}

/**
 * 判断是否为静态资源
 */
function isStaticAsset(url: URL): boolean {
  return STATIC_PATTERNS.some(pattern => url.pathname.startsWith(pattern));
}

/**
 * 处理API请求 - 网络优先，失败时回退到缓存
 */
async function handleApiRequest(request: Request): Promise<Response> {
  try {
    // 尝试网络请求
    const networkResponse = await fetch(request);
    
    // 只缓存成功的GET请求
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败，尝试缓存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线响应
    return new Response(
      JSON.stringify({ error: 'Network error', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * 处理静态资源 - 缓存优先
 */
async function handleStaticAsset(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // 后台更新缓存
    fetch(request).then((response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response);
      }
    });
    
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 返回默认离线资源
    return new Response('Offline', { status: 503 });
  }
}

/**
 * 处理导航请求
 */
async function handleNavigationRequest(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 缓存HTML页面
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // 尝试缓存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线页面
    return caches.match('/offline');
  }
}

/**
 * 网络优先策略
 */
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * 缓存优先策略
 */
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * 消息处理
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.includes(event.data.cacheName || '')) {
            return caches.delete(cacheName);
          }
        })
      );
    });
  }
});