/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 gzip/brotli 压缩（减少传输大小）
  compress: true,
  
  // 针对Netlify部署优化
  trailingSlash: true,
  
  // 静态部署不支持图片优化
  images: {
    unoptimized: true,
    // 配置默认图片格式以优化加载
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 环境变量配置
  env: {
    CUSTOM_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_ANALYTICS: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
  },
  
  // 增强的 webpack 配置
  webpack: (config, { isServer, dev }) => {
    // 处理WASM文件
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // 确保CSS文件不被Sucrase处理
    config.module.rules.forEach((rule) => {
      if (rule.oneOf) {
        rule.oneOf.forEach((oneOfRule) => {
          if (oneOfRule.test && oneOfRule.test.toString().includes('css')) {
            if (Array.isArray(oneOfRule.use)) {
              oneOfRule.use = oneOfRule.use.filter((loader) => {
                if (typeof loader === 'object' && loader.loader) {
                  return !loader.loader.includes('sucrase');
                }
                return true;
              });
            }
          }
        });
      }
    });

    // 处理OG图片生成器
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // 生产环境性能优化
    if (!dev && !isServer) {
      // 启用 Tree Shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // 代码分割优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
          },
          // 将 React 相关代码单独分包
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            chunks: 'all',
            priority: 15,
          },
        },
      };
      
      // 模块连接优化
      config.optimization.concatenateModules = true;
    }

    // 构建性能优化
    if (dev) {
      // 开发环境下禁用缓存以提高构建速度
      config.cache = false;
    }

    // 优化模块解析
    config.resolve.alias = {
      ...config.resolve.alias,
      // 添加路径别名（如果需要）
      // '@/components': path.join(__dirname, 'src/components'),
    };
    
    return config;
  },
  
  // 静态资源生成优化
  generateBuildId: async () => {
    if (process.env.BUILD_ID) {
      return process.env.BUILD_ID;
    }
    return `blog-${Date.now()}`;
  },
  
  // 静态资源优化
  async rewrites() {
    return [
      {
        source: '/service-worker.js',
        destination: '/_next/static/service-worker.js',
      },
    ];
  },
  
  // 启用实验性性能优化特性
  experimental: {
    // 启用服务器组件（适用于 Next.js 13.4+）
    serverComponentsExternalPackages: [],
    
    // 优化构建输出追踪
    outputFileTracingRoot: undefined,
    
    // 启用客户端路由缓存
    serverActions: true,
  },
  
  // 生产环境特定配置
  productionBrowserSourceMaps: false,
  
  // 输出独立构建（适用于静态部署）
  output: 'standalone',
  
  // 配置缓存策略
  onDemandEntries: {
    // 开发环境下保持页面最多 5 分钟在内存中
    maxInactiveAge: 25 * 1000,
    // 同时最多缓存 10 个页面
    pagesBufferLength: 2,
  },
  
  // 配置页面扩展名
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // 配置 distDir 以便 Netlify 正确识别
  distDir: process.env.NETLIFY ? '.next' : '.next',
  
  // 启用自动优化
  swcMinify: true,
  
  // 配置转译包
  transpilePackages: [],
  
  // 配置模块加载器
  modularizeImports: {
    // 针对常用库的按需加载
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  
  // 配置 HTTP 头部
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*(.css|.js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*(.png|.jpg|.jpeg|.gif|.ico|.svg|.webp|.avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // 配置重定向规则
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);