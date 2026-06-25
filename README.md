# Translation Agent

一个智能的中英文翻译工具，支持快速模式和专业三步翻译流程，提供领域管理和大模型配置功能。

## 功能特性

- **双模式翻译**

  - 快速模式：单次调用，快速翻译
  - 专业模式：三步流程（直译 → 问题分析 → 意译），信达雅
  - 领域自适应：五步流程（领域识别 → 术语生成 → 直译 → 问题分析 → 意译），专业精准
- **智能语言检测**

  - 自动识别中英文
  - 自动选择目标语言
- **领域管理**

  - 二级分类管理
  - 领域约束提示词
  - 支持自定义翻译规则
- **多输出格式**

  - 对照模式：原文和译文并排显示
  - 纯译文模式：仅显示翻译结果
- **大模型支持**

  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude)
  - 自定义 API（兼容 OpenAI 格式）
- **WebDAV 同步**

  - 配置和历史记录云端同步
  - 自动同步和冲突处理
  - 多设备数据共享

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Rsbuild (基于 Rspack)
- **状态管理**: Zustand
- **路由**: React Router v6
- **样式**: Tailwind CSS
- **HTTP 客户端**: Axios
- **部署平台**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 3. 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录。

### 4. 预览生产版本

```bash
npm run preview
```

## 使用说明

### 配置大模型

1. 进入"设置"页面
2. 选择"大模型配置"标签
3. 填写配置信息：
   - 配置名称：便于识别的名称
   - 提供商：OpenAI / Anthropic / 自定义
   - API Key：从服务商获取的密钥
   - 模型：如 `gpt-4`, `claude-3-opus-20240229`
4. 点击"测试连接"验证配置
5. 点击"保存配置"
6. 在配置列表中点击配置以激活

### 管理翻译领域

1. 进入"领域管理"页面
2. 添加一级分类（如"技术"、"医学"）
3. 选中一级分类，添加二级分类（如"软件开发"、"生物医药"）
4. 选中二级分类，编辑领域约束提示词
5. 提示词格式示例：

```markdown
## 领域背景
软件开发领域注重技术准确性和专业术语的一致性

## 术语库（中英对照）
- 应用程序 -> Application
- 接口 -> Interface
- 框架 -> Framework

## 常见误译提示
- 避免将 Interface 翻译为"接口"在所有场景，UI 相关应翻译为"界面"

## 翻译风格建议
- 该领域倾向于技术风格，保留英文专业术语
```

### 进行翻译

1. 进入"翻译"页面
2. 选择翻译模式（快速/专业）
3. 选择输出格式（对照/纯译文）
4. 可选：选择专业领域
5. 输入需要翻译的文本
6. 点击"开始翻译"

### 配置 WebDAV 同步（可选）

1. 进入"设置"页面
2. 选择"WebDAV 同步"标签
3. 填写 WebDAV 服务器信息
4. 可选：启用自动同步，设置同步周期和冲突策略
5. 点击"保存配置"

## 项目结构

```
translationAgent/
├── src/
│   ├── components/          # UI 组件
│   │   └── common/          # 通用组件
│   ├── pages/              # 页面组件
│   │   ├── Translation.tsx
│   │   ├── DomainManagement.tsx
│   │   └── Settings.tsx
│   ├── stores/             # Zustand 状态管理
│   │   ├── translationStore.ts
│   │   ├── domainStore.ts
│   │   ├── llmConfigStore.ts
│   │   └── webdavStore.ts
│   ├── services/           # 业务逻辑层
│   │   ├── llm/           # LLM API 封装
│   │   ├── translation/   # 翻译服务
│   │   └── webdav/        # WebDAV 同步
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript 类型定义
│   ├── App.tsx
│   └── index.tsx
├── public/
├── rsbuild.config.ts
├── tailwind.config.js
├── package.json
└── vercel.json
```

## 部署到 Vercel

### 方法 1: 通过 Vercel CLI

```bash
npm install -g vercel
vercel
```

### 方法 2: 通过 Git 集成

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. Vercel 会自动检测构建配置并部署

## 注意事项

- **API Key 安全**: 所有 API Key 仅存储在浏览器本地，不会上传到服务器
- **WebDAV 密码**: 建议使用应用专用密码，不要使用主账号密码
- **跨域问题**: 如果直接调用 LLM API 遇到 CORS 问题，建议使用反向代理或 Vercel Functions

# 友联

[LINUX DO - 新的理想型社区](https://linux.do/)

## 许可证

MIT
