/** @type {import('next').NextConfig} */
const nextConfig = {
  // 针对Netlify静态部署优化
  output: 'export',
  trailingSlash: true,
  
  // 静态部署不支持图片优化
  images: {
    unoptimized: true
  },
  
  // 禁用遥测
  telemetry: {
    disabled: true
  },
  
  // 确保构建ID唯一性
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
  // 环境变量配置
  env: {
    CUSTOM_BUILD_TIME: new Date().toISOString()
  }
}

module.exports = nextConfig