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
  
  // Netlify特定配置
  experimental: {
    outputFileTracingRoot: undefined,
  }
}

module.exports = nextConfig