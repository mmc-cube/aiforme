# 文章页面滚动性能优化总结

## 优化完成的内容

### 1. 标题ID生成统一化
- **创建了 `src/lib/heading-utils.ts` 工具函数库**
  - `generateHeadingId()`: 统一的ID生成逻辑，保留中文字符
  - `processHtmlContent()`: 处理HTML内容，为标题添加ID和样式类
  - `parseHeadingsFromMarkdown()`: 从Markdown解析标题，使用相同的ID生成逻辑
  - 确保HTML和Markdown生成的ID完全一致

### 2. CSS类优化
- **将 `scroll-mt-20` 改为 `scroll-mt-24`**
  - 提供更好的滚动偏移效果
  - 确保标题不会被固定头部遮挡

### 3. TableOfContents组件性能优化
- **使用 `requestAnimationFrame` 优化滚动监听**
  - 避免滚动事件频繁触发导致的性能问题
  - 添加了5px的滚动阈值，减少不必要的更新
- **使用 `passive: true` 事件监听器**
  - 提升滚动性能，告知浏览器不会调用 `preventDefault()`
- **优化了ID生成逻辑**
  - 确保与页面HTML中的ID完全匹配
  - 处理ID重复情况，自动添加数字后缀

### 4. Hash导航支持
- **添加了URL hash导航功能**
  - 支持通过URL直接跳转到特定章节（如 `/posts/1#section-2`）
  - 页面加载时自动滚动到hash位置
  - 监听hash变化，支持浏览器前进/后退
- **使用 `history.pushState()` 更新URL**
  - 避免页面刷新，提供更好的用户体验
- **利用CSS `scroll-behavior: smooth`**
  - 移除了JavaScript的平滑滚动，依赖浏览器原生支持

### 5. 代码结构优化
- **统一的ID生成和处理逻辑**
  - 避免了代码重复
  - 确保各组件间的ID一致性
- **更好的错误处理**
  - 处理空ID情况
  - 确保DOM元素存在后再进行操作

## 性能提升点

1. **滚动性能**: 使用requestAnimationFrame和passive事件监听器，减少了滚动时的性能开销
2. **内存优化**: 避免了频繁的DOM查询和状态更新
3. **用户体验**: 支持hash导航，允许用户直接链接到特定章节
4. **一致性**: HTML和目录使用相同的ID生成逻辑，确保点击目录能正确定位

## 技术细节

- 保留了中文字符在ID中的支持
- 使用CSS的 `scroll-behavior: smooth` 替代JavaScript滚动
- 通过 `useRef` 避免重复处理hash导航
- 使用 `Set` 数据结构确保ID唯一性

## 测试建议

1. 测试包含中文标题的文章
2. 测试包含重复标题的文章（应自动添加数字后缀）
3. 测试通过URL hash直接访问章节
4. 测试浏览器的后退/前进功能
5. 测试滚动性能，特别是在长文章中