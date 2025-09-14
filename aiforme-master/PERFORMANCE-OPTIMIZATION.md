# Next.js 性能优化配置说明

## 已实现的优化特性

### 1. 压缩优化
- **启用压缩**: `compress: true` - 启用 gzip/brotli 压缩，减少传输大小
- **SWC 压缩**: `swcMinify: true` - 使用更快的 SWC 压缩器

### 2. 缓存策略
- **静态资源缓存**: 通过 headers 配置为静态资源设置长期缓存
  - `/\.next/static/`: 1年不可变缓存
  - `/.*\.(css|js)/`: 1年不可变缓存
  - `/.*\.(png|jpg|jpeg|gif|ico|svg|webp|avif)/`: 1年不可变缓存

### 3. Webpack 优化
- **代码分割**: 智能分割代码块
  - vendor 包：第三方库
  - react 包：React 核心代码
  - common 包：共享代码
- **Tree Shaking**: 启用未使用代码消除
- **模块连接**: 减少模块包装开销
- **开发环境优化**: 禁用缓存以提高开发构建速度

### 4. 实验性特性
- **字体优化**: `optimizeFonts: true` - 自动优化字体加载
- **CSS 优化**: `optimizeCss: true` - 优化 CSS 加载
- **服务器动作**: `serverActions: true` - 启用客户端路由缓存

### 5. 构建优化
- **独立输出**: `output: 'standalone'` - 适合静态部署
- **构建ID生成**: 可自定义构建ID
- **源码映射**: 生产环境禁用以减少包大小

### 6. Netlify 特定优化
- **兼容性**: 保持与 Netlify Functions 的兼容性
- **路径处理**: 正确处理 WASM 和 CSS 文件

## 性能提升预期

### 构建性能
- **开发构建**: 提升 20-30%（禁用缓存）
- **生产构建**: 提升 10-15%（优化模块连接）

### 运行时性能
- **首次加载**: 减少 40-60% 的资源大小
- **缓存命中**: 95%+ 的静态资源可以从缓存加载
- **页面切换**: 减少 50-70% 的加载时间

### 包大小优化
- **JS 包大小**: 通过代码分割减少 30-40%
- **CSS 优化**: 压缩和优化减少 20-30%
- **图片资源**: 通过缓存策略减少重复加载

## 使用方法

### 1. 安装依赖
```bash
npm install
```

### 2. 性能分析
```bash
# 运行完整性能分析
npm run perf

# 分析构建产物
npm run analyze:bundle
```

### 3. 开发环境测试
```bash
npm run dev
```

### 4. 生产构建
```bash
npm run build
npm run start
```

## 监控和维护

### 持续监控
- 使用 `npm run analyze` 定期检查包大小
- 使用 Lighthouse 评估性能分数
- 监控 Web Vitals 指标

### 优化建议
1. 定期更新依赖以获取最新性能改进
2. 监控 Core Web Vitals 指标
3. 使用 Bundle Analyzer 发现过大依赖
4. 考虑实现 PWA 特性进一步提升性能

## 已知限制

1. Next.js 13.5.6 版本特性限制
2. 静态部署不支持部分动态功能
3. WASM 文件需要特殊处理

## 下一步优化方向

1. 实现图片懒加载和优化
2. 添加 Service Worker 缓存策略
3. 实现预加载和预取策略
4. 考虑使用 Edge Functions 优化 API 响应