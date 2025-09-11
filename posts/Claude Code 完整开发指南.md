---
title: "Claude Code 完整开发指南"
date: "2024-09-11"
excerpt: "一份从入门到精通的综合实践手册，代表了 AI 辅助编程的新范式。"
tags: ["Claude Code", "AI编程", "开发指南"]
author: "Nickey103"
---

# Claude Code 完整开发指南

一份从入门到精通的综合实践手册，代表了 AI 辅助编程的新范式。

## 引言：AI 辅助编程新范式

Claude Code 代表了 AI 辅助编程的新范式，它不仅是代码生成工具，更是智能的开发伙伴。根据实际使用数据，已有超过 115,000 名开发者使用 Claude Code，每周处理 1.95 亿行代码，这证明了其在实际开发中的价值。

### 什么是 Claude Code？

Claude Code 是 Anthropic 推出的基于终端的 AI 编程助手，它不仅仅是一个代码生成工具，而是一个能够理解整个代码库、执行命令、创建提交和管理项目的智能开发伙伴。

#### 核心特点：

- **终端原生**: 直接在终端运行，与现有开发工具无缝集成。
- **全局上下文理解**: 理解整个项目上下文，而不仅仅是单个文件。
- **任务自动化**: 可以自主执行多步骤任务，包括文件编辑、运行测试、Git 操作。
- **强大模型驱动**: 使用最新的 Claude 4 模型（Opus 4 和 Sonnet 4）。

## 成功使用的关键要素

- **建立完善的项目记忆系统**: 维护详细的 `CLAUDE.md` 文件，记录项目特有的约定和规范，并定期更新技术栈和工作流程信息。
- **遵循结构化的工作流程**: 采用探索 → 计划 → 编码 → 提交（EPCC）或 `/ask` → `/spec` → `/code` → `/test` 的渐进式开发模式。
- **充分利用深度思考模式**: 针对复杂问题使用 `think hard` 或 `ultrathink`。
- **掌握高级使用技巧**: 合理使用权限管理和成本控制，善用子任务系统处理复杂问题，并集成 MCP 服务器扩展功能。
- **建立团队协作机制**: 共享自定义命令和配置，统一代码审查流程，建立知识传承体系。

## 适用场景分析

### Claude Code 最擅长的场景：

- 复杂业务逻辑的分析和实现
- 系统架构设计和重构
- 代码审查和质量改进
- 跨文件的复杂修改
- 技术调研和方案对比
- 自动化测试生成
- 文档编写和维护

### 传统工具更适合的场景：

- 简单的代码补全
- 实时语法检查
- 可视化调试
- IDE 特定功能（如重构工具）

## 第一部分：安装与基础配置

### 1.1 Windows 环境下安装 Claude Code

Claude Code 需要 Node.js 18 或更高版本。为了方便管理 Node.js 版本，强烈建议使用 Node Version Manager (nvm)。

#### 步骤 1: 安装 nvm-windows

1. 前往 [nvm-windows 的 GitHub Releases 页面](https://github.com/coreybutler/nvm-windows/releases)。
2. 下载最新的 `nvm-setup.zip` 安装包并解压安装。
3. 安装完成后，打开一个新的终端（CMD 或 PowerShell），运行以下命令验证 nvm 是否安装成功。如果显示版本号，则表示安装成功。

```bash
nvm -v
```

#### 步骤 2: 使用 nvm 安装 Node.js

1. 由于网络原因，建议先设置 nvm 的下载镜像源为国内淘宝镜像，以提高下载速度。

```bash
nvm node_mirror https://npmmirror.com/mirrors/node/
nvm npm_mirror https://npmmirror.com/mirrors/npm/
```

2. 安装 Node.js v18 版本（推荐）。

```bash
nvm install 18
```

3. 切换到刚安装的 Node.js 版本。

```bash
nvm use 18
```

4. 验证 Node.js 和 npm 是否安装成功。

```bash
node -v
npm -v
```

#### 步骤 3: 安装 Claude Code

1. 同样，为了加速 npm 包的下载，建议将 npm 的源也设置为淘宝镜像源。

```bash
npm config set registry https://registry.npmmirror.com
```

2. 使用 npm 全局安装 Claude Code。

```bash
npm install -g @anthropic-ai/claude-code
```

3. 验证安装是否成功。

```bash
claude --version
```

### 1.2 API 配置 (高级/可选)

对于部分地区或需要使用代理服务的用户，可以通过设置环境变量的方式来指定 API 密钥和服务器地址。以下以 Windows 系统为例进行说明。

#### 1. 准备 API 密钥和 Base URL

在配置前，请确保您已从您的服务提供商处获取了 API 密钥 (API Key) 和服务器地址 (Base URL)。

#### 2. 配置 Windows 环境变量

获取信息后，需要将其配置到系统的环境变量中。

1. **打开环境变量设置**: 在 Windows 搜索框中搜索"环境变量"，然后选择"编辑系统环境变量"。在弹出的"系统属性"窗口中，点击"环境变量"按钮。

2. **设置 API 密钥**: 在下方的"系统变量"区域，点击"新建"。
   - 变量名填入: `ANTHROPIC_AUTH_TOKEN`
   - 变量值填入您的 API 密钥。

```bash
变量名: ANTHROPIC_AUTH_TOKEN
变量值: sk-2wpopHbqqPD2oHKeafjw2BKXMDGYVqvotDwja6D5jcHgq2zd
```

3. **设置代理 URL**: 再次点击"新建"。
   - 变量名填入: `ANTHROPIC_BASE_URL`
   - 变量值填入您的 Base URL。

```bash
变量名: ANTHROPIC_BASE_URL
变量值: https://anyrouter.top
```

4. **保存并重启**: 依次点击所有窗口的"确定"按钮保存设置。为了使环境变量生效，您可能需要重启您的终端（如 CMD, PowerShell）或重启电脑。

### 1.3 首次启动和认证

在项目目录中启动 Claude Code，首次运行会提示登录。支持 Claude Pro ($20/月) 或 Claude Max ($30/月) 订阅。

```bash
# 在项目目录中启动 Claude Code
cd your-project
claude
```

### 1.4 项目初始化

创建项目配置文件（最重要的一步！），这会生成 `CLAUDE.md` 文件，作为项目的"记忆系统"。

```bash
> /init
```

### 1.5 CLAUDE.md 配置示例

```markdown
# CLAUDE.md

## 项目概述
这是一个使用 React 和 Node.js 构建的任务管理应用

## 技术栈
- 前端：React 18, TypeScript, Tailwind CSS
- 后端：Node.js, Express, PostgreSQL
- 测试：Jest, React Testing Library

## 常用命令
- npm run dev: 启动开发服务器
- npm run test: 运行测试
- npm run build: 构建生产版本

## 代码规范
- 使用 ES6 模块语法（import/export）
- 组件使用 PascalCase 命名
- 函数使用 camelCase 命名
- 每个新功能都需要编写测试

## 工作流程
- 功能分支命名：feature/功能描述
- 提交信息格式：type(scope): description
- 代码审查后再合并到主分支
```

## 第二部分：核心命令详解

### 2.1 内置命令

| 命令 | 用途 | 使用示例 |
|------|------|----------|
| /help | 显示所有可用命令 | `> /help` |
| /clear | 清空对话历史（重要！） | `> /clear` |
| /init | 初始化项目配置 | `> /init` |
| /memory | 编辑 CLAUDE.md 文件 | `> /memory` |
| /model | 切换 Claude 模型 | `> /model opus-4` |
| /compact | 压缩对话以节省 token | `> /compact` |
| /cost | 查看 token 使用和成本 | `> /cost` |
| /permissions | 管理工具权限 | `> /permissions` |
| /review | 代码审查功能 | `> /review` |

### 2.2 自定义命令创建

提到的 `/ask`、`/spec`、`/code`、`/test` 等命令实际上是社区创建的自定义命令。以下是如何创建和使用它们：

#### 创建项目级自定义命令

```bash
# 创建命令目录
mkdir -p .claude/commands

# 创建自定义命令文件
touch .claude/commands/ask.md
touch .claude/commands/spec.md
touch .claude/commands/code.md
touch .claude/commands/test.md
```

💡 **实用技巧**
如果您在创建或配置这些自定义命令模板时遇到问题，可以直接向 Claude 求助！例如，您可以直接提问："我应该怎么把这个 /ask 命令模板添加到我的自定义命令里？" Claude 会引导您完成文件创建和内容填充的整个过程。

#### /ask 命令模板

保存为 `.claude/commands/ask.md`

```markdown
## 背景
技术问题或架构挑战：$ARGUMENTS

## 你的角色
作为高级系统架构师，基于当前代码库提供专业建议。

## 分析流程
1. 分析与问题相关的代码库结构
2. 考虑技术约束和需求
3. 提供多种解决方案及其权衡
4. 推荐最佳方案并给出实施指导
5. 考虑性能、可维护性和扩展性

# 使用方式：> /project:ask "如何实现用户认证系统？"
```

#### /spec 命令模板

保存为 `.claude/commands/spec.md`

```markdown
## 背景
需要规范的功能或组件：$ARGUMENTS

## 你的角色
作为技术规范编写专家，创建详细的可实施规范。

## 输出格式
1. **功能概述** - 目的和范围
2. **技术需求** - 详细的技术规格
3. **API 设计** - 接口和数据结构
4. **实施计划** - 分步开发方法
5. **测试策略** - 验证和质量保证方法
6. **性能要求** - 响应时间、并发等指标

# 使用方式：> /project:spec "用户仪表板实时数据展示功能"
```

#### /code 命令模板

保存为 `.claude/commands/code.md`

```markdown
## 背景
实现任务：$ARGUMENTS

## 你的角色
作为高级开发工程师，使用最佳实践实现功能。

## 开发流程
1. **分析** - 理解需求和约束
2. **设计** - 规划组件结构和接口
3. **实现** - 编写生产级代码
4. **测试** - 创建适当的测试
5. **集成** - 确保与现有代码库的兼容性

## 输出要求
- 完整、可工作的代码，包含详细注释
- 错误处理和边缘情况管理
- 遵循 CLAUDE.md 中的项目编码标准
- 包含单元测试
- 考虑性能优化

# 使用方式：> /project:code "实现密码重置功能"
```

#### /test 命令模板

保存为 `.claude/commands/test.md`

```markdown
## 背景
需要测试的代码：$ARGUMENTS

## 你的角色
作为测试工程专家，创建全面的测试套件。

## 测试策略
1. **单元测试** - 测试单个函数和方法
2. **集成测试** - 测试组件交互
3. **边缘情况** - 测试边界条件和错误场景
4. **性能测试** - 验证性能要求

## 输出格式
- 完整的测试文件，包含清晰的描述
- 适当地模拟依赖项
- 覆盖成功和失败场景
- 遵循项目测试约定
- 使用 AAA 模式（Arrange-Act-Assert）

# 使用方式：> /project:test "用户认证服务"
```

## 第三部分：完整开发流程实战

### 3.1 需求分析阶段（/ask + /spec）

```bash
# 步骤 1：使用 /ask 进行技术咨询
> /project:ask "我需要实现一个支持多用户的实时聊天功能，应该采用什么技术架构？"
# Claude 会分析你的项目并提供：
# - WebSocket vs Server-Sent Events 的比较
# - 数据库设计建议等

# 步骤 2：基于咨询结果创建详细规范
> /project:spec "基于 WebSocket 的实时聊天系统，支持私聊和群聊"
# Claude 会生成包含功能需求、API 设计等的规范。
```

### 3.2 探索-计划-编码-提交工作流（EPCC）

这是 Claude Code 推荐的核心工作流程：

```bash
# 1. 探索阶段 - 不编码，只阅读和理解
> "请阅读项目中与用户系统相关的所有文件，不要进行任何修改"

# 2. 计划阶段 - 使用 "think" 关键词触发深度思考
> "请深入思考如何实现聊天功能，制定详细的实施计划"

# 3. 编码阶段 - 基于批准的计划实施
> /project:code "根据刚才的计划实现 WebSocket 聊天服务"

# 4. 提交阶段 - 创建有意义的提交
> "审查我的更改并创建一个描述性的提交信息"
```

## 第四部分：项目管理最佳实践

### 4.1 文件组织结构

```bash
project-root/
├── CLAUDE.md              # 项目记忆文件
├── .claude/
│   ├── commands/         # 自定义命令
└── src/
    └── ...
```

### 4.2 ROADMAP.md 进度管理

```markdown
# ROADMAP.md

## 进度标记说明
- `[ ]` = 待办
- `[-]` = 进行中 🏗️
- `[x]` = 已完成 ✅

## 高优先级任务
- [x] **用户认证系统** - JWT 实现 ✅ 2025/01/20
- [-] **实时聊天功能** - WebSocket 集成 🏗️ 2025/01/23
```

### 4.3 多 Claude 实例协作

```bash
# 终端 1：功能开发
cd feature-branch
claude
> "实现聊天功能的前端部分"

# 终端 2：后端开发
cd backend-branch
claude
> "实现聊天功能的 API 端点"

# 终端 3：测试和审查
cd main
claude
> "审查 feature-branch 和 backend-branch 的代码"
```

## 第五部分：常见错误及解决方案

### 5.1 初学者常犯的错误

- **跳过规划阶段**: 直接要求 "实现xx功能"。正确做法是先用 `/ask` 咨询，再用 `/spec` 规范，最后用 `/code` 实现。
- **上下文管理不当**: 让对话持续很长时间，上下文混乱。正确做法是完成每个任务后使用 `/clear`。
- **指令不够具体**: 例如 "优化这段代码"。正确做法是 "优化这个函数的性能，重点减少数据库查询次数..."。
- **忽视 CLAUDE.md 文件**: 每次都重复解释项目背景。正确做法是维护详细的 `CLAUDE.md`。

### 5.2 权限管理问题

```bash
# 查看和配置权限
> /permissions

# 对于可信环境，可以跳过权限提示（谨慎使用）
claude --dangerously-skip-permissions
```

## 第七部分：高级使用技巧与实战案例

### 7.1 深度思考模式的使用

```bash
# 四个级别的深度思考，消耗 token 递增
"think"           # 基础思考模式
"think hard"      # 中等深度思考
"think harder"    # 高强度思考
"ultrathink"      # 最深层分析

# 实际使用示例
> "请 ultrathink 这个数据库设计方案，考虑性能、扩展性和维护性"
```

### 7.2 图像处理与视觉开发

```bash
# macOS 用户使用 Ctrl+V 粘贴图片（不是 Command+V）
> "基于这个设计稿实现前端界面" [粘贴截图]

# 错误界面分析
> "这是错误页面的截图，分析可能的原因" [错误截图]
```

### 7.4 子任务系统与并行处理

```bash
# 多角度分析同一问题
> "创建 4 个子任务来分析我们的组件库：
   1. 设计系统专家 - 分析颜色和主题一致性
   2. 可访问性专家 - 检查 ARIA 标签和键盘导航
   3. 性能专家 - 分析 bundle 大小和渲染性能
   4. 维护性专家 - 评估代码结构和文档质量"
```