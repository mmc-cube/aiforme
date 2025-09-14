# 认证系统迁移指南

本文档说明了如何将现有的认证组件迁移到新的统一认证系统。

## 新系统概述

新的统一认证系统包含以下核心组件：

1. **UnifiedAuthService** (`/src/lib/unified-auth.ts`)
   - 单例模式管理所有认证状态
   - 自动同步前后端状态
   - 支持 Cookie、localStorage、sessionStorage 多种存储
   - 实时状态监控和事件系统

2. **AuthCleanupService** (`/src/lib/auth-cleanup.ts`)
   - 清理所有存储位置的认证数据
   - 支持深度清理包括 Service Worker
   - 提供诊断数据摘要

3. **BrowserCompatibilityService** (`/src/lib/browser-compat.ts`)
   - 检测浏览器兼容性
   - 生成兼容性报告和建议
   - 支持隐私模式和广告拦截器检测

4. **UnifiedLogger** (`/src/lib/unified-logger.ts`)
   - 统一的日志系统
   - 支持远程日志记录
   - 错误处理和堆栈跟踪

## 迁移步骤

### 1. 更新管理员认证提供者

**旧代码** (`/src/components/admin/AuthProvider.tsx`):
```typescript
// 移除旧的 AuthProvider
// 将被统一认证系统替代
```

**新用法**:
```typescript
// 在管理员布局中直接使用 useUnifiedAuth hook
import { useUnifiedAuth } from '@/lib/unified-auth';

export default function AdminLayout() {
  const auth = useUnifiedAuth();
  
  // 使用 auth.isAuthenticated, auth.user, auth.login, auth.logout
}
```

### 2. 更新用户认证提供者

**旧代码** (`/src/components/AuthProvider.tsx`):
```typescript
// 移除旧的 AuthProvider
// 将被统一认证系统替代
```

**新用法**:
```typescript
// 在应用布局中初始化统一认证
import { unifiedAuth } from '@/lib/unified-auth';

// 在 _app.tsx 或根组件中
useEffect(() => {
  unifiedAuth.initialize();
}, []);
```

### 3. 更新登录表单

**旧代码**:
```typescript
const { login } = useAuth(); // 旧的 Auth hook
const result = await login(inviteCode);
```

**新代码**:
```typescript
import { useUnifiedAuth } from '@/lib/unified-auth';
import { log } from '@/lib/unified-logger';

const auth = useUnifiedAuth();
const result = await auth.login({ code: inviteCode });

// 自动记录日志
if (result.success) {
  log.info('auth', 'User logged in successfully');
}
```

### 4. 更新后端 API 验证

**确保后端 API 支持以下特性**:
- 从 Cookie 和 Authorization Header 双重读取 token
- 返回标准化的错误格式
- 支持跨域和凭证传递

### 5. 添加错误处理

```typescript
// 在应用入口添加全局错误处理
import { ErrorHandler } from '@/lib/unified-logger';

ErrorHandler.setupGlobalHandlers();

// 包装异步操作
const result = await ErrorHandler.wrap(
  () => fetch('/api/admin/auth/verify'),
  'auth',
  'Verify authentication'
);
```

## 使用诊断工具

### 访问诊断页面
管理员可以访问 `/admin/debug` 查看完整的认证状态诊断信息。

### 使用清理工具
```typescript
import { authCleanup } from '@/lib/auth-cleanup';

// 标准清理
await authCleanup.cleanup();

// 深度清理
await authCleanup.cleanup({
  clearServiceWorker: true,
  clearCache: true
});

// 获取诊断数据
const summary = await authCleanup.getAuthDataSummary();
```

### 使用兼容性检测
```typescript
import { browserCompat } from '@/lib/browser-compat';

const compatibility = await browserCompat.checkCompatibility();
console.log('Browser score:', compatibility.score);
```

## 最佳实践

### 1. 初始化顺序
```typescript
// 在应用初始化时
useEffect(() => {
  // 1. 初始化日志系统
  logger.initialize();
  
  // 2. 设置全局错误处理
  ErrorHandler.setupGlobalHandlers();
  
  // 3. 初始化认证系统
  unifiedAuth.initialize();
  
  // 4. 可选：执行兼容性检测
  browserCompat.checkCompatibility();
}, []);
```

### 2. 状态监听
```typescript
// 监听认证状态变化
const unsubscribe = unifiedAuth.subscribe((state) => {
  console.log('Auth state changed:', state);
});

// 监听认证事件
const eventUnsubscribe = unifiedAuth.onEvent((event) => {
  console.log('Auth event:', event);
});
```

### 3. 错误处理模式
```typescript
// 使用统一的错误处理
try {
  const result = await someAsyncOperation();
} catch (error) {
  log.error('category', 'Operation failed', error);
  // 显示用户友好的错误消息
  showErrorToast(error.message);
}
```

## 迁移检查清单

- [ ] 移除旧的 AuthProvider 组件
- [ ] 更新所有使用 useAuth 的地方为 useUnifiedAuth
- [ ] 添加统一认证系统初始化
- [ ] 设置全局错误处理
- [ ] 测试登录/登出流程
- [ ] 验证状态同步功能
- [ ] 测试诊断页面功能
- [ ] 检查浏览器兼容性
- [ ] 验证清理工具功能

## 常见问题

### Q: 如何处理双重认证状态？
A: 统一认证系统会自动合并多个存储位置的状态，确保一致性。

### Q: 如何调试认证问题？
A: 使用 `/admin/debug` 页面查看完整的诊断信息，包括存储数据、事件日志和兼容性报告。

### Q: 如何清理混乱的认证状态？
A: 使用诊断页面中的清理工具，或调用 `authCleanup.cleanup()` 方法。

### Q: 如何支持离线模式？
A: 系统会自动检测在线状态，并在恢复连接时同步日志。

## 性能考虑

1. **日志存储限制**: 默认只保留最近1000条日志记录
2. **状态同步间隔**: 每30秒同步一次认证状态
3. **兼容性缓存**: 5分钟缓存兼容性检测结果
4. **懒加载**: 统一认证系统只在需要时初始化