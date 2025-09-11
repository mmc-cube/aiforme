/** @type {import('next').NextConfig} */
const nextConfig = {
  // 针对Netlify部署优化 - 使用标准构建而非export
  trailingSlash: true,
  
  // 静态部署不支持图片优化
  images: {
    unoptimized: true
  },
  
  // 环境变量配置
  env: {
    CUSTOM_BUILD_TIME: new Date().toISOString()
  },
  
  // Webpack配置：处理WASM文件和CSS问题
  webpack: (config, { isServer }) => {
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
    
    return config;
  },
  
  // 配置支持实验性功能
  experimental: {
    outputFileTracingRoot: undefined,
    serverComponentsExternalPackages: [],
  }
}

module.exports = nextConfig