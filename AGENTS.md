# AGENTS.md

## 项目概览
API Tester — 轻量级 Web 端接口测试工具，支持多种 HTTP 方法、请求头/参数/Body 配置、响应格式化、请求历史记录。通过后端代理解决跨域问题。

## 版本技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS 4
- **默认主题**: 深色模式 (dark)

## 目录结构
```
src/
├── app/
│   ├── api/proxy/route.ts   # 后端代理 API，转发请求避免跨域
│   ├── globals.css           # 全局样式与 CSS 变量
│   ├── layout.tsx            # 根布局（默认 dark class）
│   └── page.tsx              # 首页入口
├── components/
│   ├── api-tester.tsx        # 主测试工具组件（请求/响应/历史）
│   ├── key-value-editor.tsx  # Key-Value 键值对编辑器（Headers/Params）
│   └── ui/                   # shadcn/ui 组件库
└── lib/utils.ts              # 工具函数 (cn)
```

## 构建与测试命令
- 安装依赖：`pnpm install`
- 开发：`pnpm dev`（端口 5000，支持 HMR）
- 构建：`pnpm build`
- 生产启动：`pnpm start`
- TypeScript 检查：`pnpm ts-check`
- ESLint：`pnpm lint`

## 代码风格
- 严格 TypeScript，禁止隐式 any
- 使用 'use client' 标记客户端组件
- 等宽字体用于代码/URL/请求体区域
- HTTP 方法颜色编码：GET=绿、POST=琥珀、PUT=蓝、DELETE=红、PATCH=紫

## 核心业务逻辑
- 前端通过 `/api/proxy` 后端路由转发请求，规避浏览器 CORS 限制
- 代理 API 接收 {url, method, headers, body, params}，30s 超时
- 响应自动检测并格式化 JSON
- 请求历史存储在组件 state 中（最多 50 条）
