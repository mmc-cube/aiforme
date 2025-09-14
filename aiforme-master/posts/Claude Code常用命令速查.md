---
title: "Claude Code常用命令速查"
date: "2024-09-11"
excerpt: "Claude Code常用命令的快速参考指南，包含高频命令和实用技巧。"
tags: ["Claude Code", "命令速查", "AI编程"]
author: "Nickey103"
---

# Claude Code常用命令速查

> 来源：博客园 - Nickey103  
> 发布时间：2025年7月9日  
> 字数：4326字

## 前言

Claude Code是Anthropic推出的AI编程助手，运行在终端中，能通过自然语言帮你编写、调试和管理代码。

## 高频命令

```bash
# 打开当前目录下的聊天记录
claude --resume

# 继续当前目录的上一次聊天
claude -c

# 清除终端屏幕，但保留对话历史
control + L

# 为项目生成或更新文档CLAUDE.md
/init

# 给予全部权限（风险大）
开启聊天时赋予权限
claude -c --dangerously-skip-permissions
聊天时赋予权限
shift + TAB

# 开启plan模式（仅赋予Read权限，可用于快速了解代码库而不轻易更改）
两次 shift + TAB

# 开启思考模式
在提示词中加入 ultrathink 等关键字

# 选择模型
/model

# 查看上下文占用情况
/context

# 引用文件
@ + 文件名

# 请求代码审查
/review

# 取消当前输入或生成
control + C

# 管道输入
cat file.py | claude -p "优化这段代码"

# 粘贴图片
control + v

# 换行
Option+Enter

# 编辑CLAUDE.md
/memory

# 开启任务结束响铃通知
claude config set --global preferredNotifChannel terminal_bell

# 退出 Claude Code 会话
control + D

# 在控制台查看每日API费用
npx ccusage@latest
```

### ccusage其他常用指令：

```bash
# 基础用法  
ccusage          # 显示每日报告（默认）  
ccusage daily    # 每日 token 使用量及费用  
ccusage monthly  # 月度汇总报告  
ccusage session  # 按会话统计用量  
ccusage blocks   # 5小时计费窗口数据  

# 实时监控  
ccusage blocks --live  # 实时用量仪表盘  

# 筛选与选项  
ccusage daily --since 20250525 --until 20250530  # 指定日期范围  
ccusage daily --json      # 输出 JSON 格式  
ccusage daily --breakdown # 按模型细分费用

# 在CC中跑Bash命令
！+ Bash命令

# 内存快捷键 - 添加到 CLAUDE.md	
# + 需要写入到CLAUDE.md中的规则
```

## 一、基础启动命令

### 1.1 启动方式

```bash
# 直接启动交互模式
claude

# 带初始问题启动
claude "帮我分析这个项目结构"

# 一次性执行并退出
claude -p "解释这个函数"

# 管道输入
cat file.py | claude -p "优化这段代码"
```

### 1.2 常用启动参数

- `--resume`: 恢复上次会话
- `--plan`: 启用计划模式（适合复杂任务）
- `--architect`: 大型项目架构模式

## 二、核心Slash命令

### 2.1 基础管理

```bash
/help          # 查看帮助
/clear         # 清除历史记录
/exit          # 退出程序
/cost          # 查看Token使用情况
/doctor        # 检查系统状态
```

### 2.2 项目管理

```bash
/memory        # 编辑项目记忆
/memory view   # 查看项目记忆
/config        # 查看配置
/init          # 初始化项目文档
```

### 2.3 会话优化

```bash
/compact       # 压缩会话内容
/bug           # 报告问题
/terminal-setup # 终端设置
```

## 三、实用技巧

### 3.1 CLAUDE.md文件

在项目根目录创建`CLAUDE.md`文件，Claude会自动读取：

```markdown
# 项目说明
这是一个React项目

## 常用命令
- 启动：npm start
- 测试：npm test
- 构建：npm run build

## 注意事项
- 使用TypeScript
- 遵循ESLint规则
```

### 3.2 Memory功能

```bash
# 设置项目记忆
/memory
项目使用Vue3 + TypeScript
API地址：https://api.example.com
测试账号：test@example.com
```

### 3.3 自定义命令

在`.claude/commands/`目录创建`.md`文件：

```markdown
# debug.md
请帮我调试以下问题：$ARGUMENTS

步骤：
1. 检查错误日志
2. 分析原因
3. 提供解决方案
```

使用：`/debug "登录失败"`

## 四、常见使用场景

### 4.1 代码调试

```bash
"这个函数报错了，帮我看看问题在哪"
"为什么我的API请求失败了？"
"这个React组件渲染有问题"
```

### 4.2 代码优化

```bash
"优化这段代码的性能"
"重构这个函数，让它更简洁"
"添加错误处理"
```

### 4.3 项目管理

```bash
"帮我写单元测试"
"创建一个新的API接口"
"更新项目文档"
"提交代码到git"
```

## 五、最佳实践

### 5.1 高效工作流

1. **项目启动**：创建CLAUDE.md文件
2. **设置记忆**：使用`/memory`记录项目信息
3. **定期清理**：使用`/clear`清除无关历史
4. **善用自定义命令**：创建常用工作流模板

### 5.2 提问技巧

- **明确具体**：不要说"有问题"，要说"登录接口返回500错误"
- **提供上下文**：告诉Claude你的技术栈和项目类型
- **分步骤**：复杂任务可以分解为多个简单步骤

### 5.3 性能优化

```bash
/compact       # 会话过长时压缩
/clear         # 切换任务时清理
/cost          # 定期检查Token使用
```

## 六、常见问题解决

### 6.1 安装问题

```bash
# 检查安装
claude --version

# 重新安装
npm install -g @anthropic/claude-code

# 检查系统状态
claude /doctor
```

### 6.2 权限问题

- 确保已设置API Key
- 检查网络连接
- 验证账户状态

### 6.3 性能问题

- 定期使用`/clear`清理历史
- 使用`/compact`压缩会话
- 避免上传大文件

## 七、进阶技巧

### 7.1 团队协作

- 将`.claude/`目录提交到git
- 共享CLAUDE.md文件
- 统一自定义命令

### 7.2 多项目管理

- 不同项目使用不同的Memory设置
- 为每个项目创建专用的CLAUDE.md
- 使用项目特定的自定义命令

### 7.3 自动化工作流

```bash
# 创建开发启动命令
# .claude/commands/dev.md
启动开发环境：
1. npm install
2. npm start
3. 打开浏览器访问 http://localhost:3000
```

## 八、实用命令速查表

| 命令 | 功能 | 使用频率 |
|------|------|----------|
| `claude` | 启动交互模式 | ⭐⭐⭐⭐⭐ |
| `claude -c` | 继续上次聊天 | ⭐⭐⭐⭐⭐ |
| `control + L` | 清屏 | ⭐⭐⭐⭐⭐ |
| `/init` | 初始化项目 | ⭐⭐⭐⭐⭐ |
| `/memory` | 项目记忆 | ⭐⭐⭐⭐ |
| `/help` | 查看帮助 | ⭐⭐⭐⭐ |
| `/clear` | 清除历史 | ⭐⭐⭐⭐ |
| `/cost` | Token使用 | ⭐⭐⭐⭐ |
| `/compact` | 压缩会话 | ⭐⭐⭐ |
| `/doctor` | 系统检查 | ⭐⭐⭐ |
| `/config` | 查看配置 | ⭐⭐ |
| `/init` | 初始化项目 | ⭐⭐ |

## 总结

Claude Code是一个强大的AI编程助手，掌握这些常用命令就能处理大部分日常开发任务：

1. **启动时**：使用`claude`进入交互模式
2. **设置项目**：创建CLAUDE.md文件，设置Memory
3. **日常使用**：善用自然语言描述需求
4. **优化性能**：定期`/clear`和`/compact`
5. **解决问题**：使用`/doctor`检查，`/help`查看帮助

记住：Claude Code最大的优势是理解自然语言，所以直接说出你的需求即可！

## 相关资源

- [Claude Code官方文档](https://docs.anthropic.com/claude-code)
- [安装指南](https://github.com/anthropics/claude-code)

## 使用开发建议

要求Claude在编码前制定计划。明确告诉它在您确认其计划看起来不错之前不要编码。

按Escape中断Claude在任何阶段（思考、工具调用、文件编辑），保留上下文以便您可以纠偏或扩展指令。

双击Escape跳回历史，编辑之前的提示词，并探索不同的方向。您可以编辑提示词并重复直到获得您要寻找的结果。

要求Claude撤销更改，通常与选项#2结合使用以采取不同的方法。

---

*本文基于博客园Nickey103的"Claude Code常用命令速查"文章整理，仅供学习参考。*