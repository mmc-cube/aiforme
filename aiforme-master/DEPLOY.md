# 🚀 Netlify 一键部署指南

本指南将帮助您在 **5 分钟内** 将个人知识分享博客部署到 Netlify。

## 📋 部署前检查清单

在开始部署前，请确保：

- [ ] 已有 GitHub 账号
- [ ] 已有 Netlify 账号（可用 GitHub 登录）
- [ ] 项目代码已推送到 GitHub 仓库

## 🎯 方法一：GitHub 自动部署（推荐）

### 步骤 1：准备 Git 仓库

```bash
# 1. 进入项目目录
cd knowledge-blog-optimized

# 2. 初始化 Git 仓库（如果尚未初始化）
git init

# 3. 添加所有文件
git add .

# 4. 提交代码
git commit -m "🎉 Initial commit: Knowledge Blog Optimized"

# 5. 连接到您的 GitHub 仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 6. 推送代码
git push -u origin main
```

### 步骤 2：连接 Netlify

1. **登录 Netlify**
   - 访问 [https://netlify.com](https://netlify.com)
   - 点击 "Log in" 
   - 选择 "GitHub" 登录

2. **新建站点**
   - 点击 "New site from Git"
   - 选择 "GitHub" 
   - 授权 Netlify 访问您的 GitHub

3. **选择仓库**
   - 在仓库列表中找到您的项目
   - 点击仓库名称

### 步骤 3：配置构建设置

Netlify 会自动检测到这是一个 Next.js 项目，但请确认设置正确：

```
Build command: npm run build
Publish directory: out
Functions directory: netlify/functions
```

如果需要手动设置：
- **Build command**: `npm run build`
- **Publish directory**: `out`
- **Functions directory**: `netlify/functions`

### 步骤 4：配置环境变量

1. **部署前设置**（推荐）
   - 在 "Deploy settings" 页面
   - 点击 "Environment variables"
   - 添加以下变量：

   ```
   变量名: JWT_SECRET
   变量值: 您的超强密码（至少32字符）
   
   变量名: INVITE_CODES  
   变量值: welcome123,demo456,test789
   
   变量名: NODE_VERSION
   变量值: 18
   ```

2. **生成安全的 JWT_SECRET**
   ```bash
   # 方法1：使用 Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # 方法2：在线生成
   # 访问：https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
   ```

### 步骤 5：开始部署

1. 点击 "Deploy site" 按钮
2. 等待构建完成（通常需要 2-3 分钟）
3. 构建成功后，您将看到：
   ```
   ✅ Site is live
   🌐 Your site is published at: https://your-site-name.netlify.app
   ```

## 🎯 方法二：拖拽部署（快速测试）

### 适用场景
- 快速测试部署
- 不需要持续集成
- 一次性部署

### 操作步骤

1. **构建项目**
   ```bash
   # 设置环境变量
   export JWT_SECRET="your-secret-key"
   export INVITE_CODES="test123,demo456"
   
   # 构建项目
   npm run build
   ```

2. **拖拽部署**
   - 访问 [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - 将 `out` 文件夹拖拽到页面中
   - 等待上传完成

3. **配置 Functions**
   - 部署后在后台配置环境变量
   - 手动上传 Functions 文件

## 🎯 方法三：Netlify CLI 部署

### 安装 CLI

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login
```

### 部署命令

```bash
# 初始化项目
netlify init

# 构建项目
npm run build

# 预览部署
netlify deploy

# 生产部署
netlify deploy --prod
```

## ✅ 部署成功验证

### 检查项目

1. **访问网站**
   - 打开 Netlify 提供的 URL
   - 应该看到邀请码输入页面

2. **测试邀请码**
   - 输入您配置的邀请码
   - 验证是否能正常访问博客内容

3. **检查文章**
   - 确认示例文章正常显示
   - 验证 Markdown 渲染正确

4. **测试 Functions**
   - 检查邀请码验证功能
   - 查看 Netlify Functions 日志

### 性能验证

```bash
# 使用 Lighthouse 测试性能
npx lighthouse https://your-site.netlify.app --view

# 期望结果：
# Performance: 90+
# Accessibility: 95+
# Best Practices: 90+
# SEO: 90+
```

## 🔧 后续配置

### 1. 自定义域名

```bash
# 添加自定义域名
netlify domains:add your-domain.com

# 配置 DNS
# 将域名的 CNAME 记录指向：your-site.netlify.app
```

### 2. HTTPS 配置

Netlify 自动提供免费 SSL 证书：
- 自动配置 Let's Encrypt
- 强制 HTTPS 重定向
- 自动续期

### 3. 分支部署

```toml
# netlify.toml 中配置
[build]
  command = "npm run build"
  publish = "out"

[context.develop]
  command = "npm run build:dev"

[context.branch-deploy]
  command = "npm run build:preview"
```

## 🐛 部署故障排查

### 构建失败

1. **Node.js 版本问题**
   ```bash
   # 确保环境变量中设置了正确版本
   NODE_VERSION=18
   ```

2. **依赖安装失败**
   ```bash
   # 清理并重新安装
   npm clean-install
   ```

3. **内存不足**
   ```bash
   # 增加 Node.js 内存限制
   NODE_OPTIONS="--max-old-space-size=4096"
   ```

### Functions 部署失败

1. **检查 Functions 目录**
   ```
   确保目录结构：
   netlify/
   └── functions/
       └── verify-invite.ts
   ```

2. **验证环境变量**
   ```bash
   # 在 Netlify 后台检查
   JWT_SECRET 和 INVITE_CODES 是否正确设置
   ```

### 访问问题

1. **邀请码无效**
   - 检查环境变量 `INVITE_CODES`
   - 确认没有额外空格
   - 验证大小写是否匹配

2. **页面 404**
   - 检查路由配置
   - 确认 `trailingSlash: true` 设置
   - 验证重定向规则

## 📊 监控和分析

### Netlify Analytics

```bash
# 启用 Netlify Analytics
# 在后台 Analytics 选项卡中启用
```

### 自定义监控

```javascript
// 添加到 layout.tsx
useEffect(() => {
  // 简单的访问统计
  if (typeof window !== 'undefined') {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        page: window.location.pathname,
        timestamp: Date.now()
      })
    });
  }
}, []);
```

## 🚀 性能优化

### 自动优化功能

Netlify 自动提供：
- ✅ 全球 CDN 分发
- ✅ 自动图片压缩
- ✅ Brotli 压缩
- ✅ HTTP/2 支持
- ✅ 智能缓存

### 手动优化

```toml
# netlify.toml 中添加
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]  
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

## 🎉 部署完成！

恭喜！您的个人知识分享博客已成功部署到 Netlify。

**接下来您可以：**

1. 📝 **添加新文章**：在 `posts/` 目录创建 Markdown 文件
2. 🎨 **自定义样式**：修改 CSS 和组件样式  
3. 🔐 **管理邀请码**：更新环境变量中的 `INVITE_CODES`
4. 📈 **监控访问**：查看 Netlify Analytics 数据
5. 🌐 **配置域名**：设置您的自定义域名

**部署 URL**: https://your-site.netlify.app  
**管理后台**: https://app.netlify.com/sites/your-site

---

🎯 **快速访问链接**
- [Netlify 控制台](https://app.netlify.com)
- [部署日志](https://app.netlify.com/sites/your-site/deploys)
- [环境变量设置](https://app.netlify.com/sites/your-site/settings/env)
- [Functions 日志](https://app.netlify.com/sites/your-site/functions)

享受您的新博客吧！ 🚀