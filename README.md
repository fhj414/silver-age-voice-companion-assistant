# 银龄语音陪伴助手

一个移动端优先的中文语音陪伴网站，面向老年人使用。页面文字大、按钮大、操作简单，支持语音输入、AI 回复、中文朗读、聊天记录保存和老年模式。

## 功能列表

- 手机浏览器优先适配，高对比度、大字号、大按钮
- 浏览器 Web Speech API 中文语音识别，默认 `zh-CN`
- 不支持语音识别时，自动提示并保留文字输入
- 通过 Next.js API Route 请求 OpenRouter，前端不暴露 API Key
- AI 回复后自动中文朗读，可关闭、停止、再读一遍
- 清晰区分“我说的话”和“助手回答”
- localStorage 保存最近聊天记录
- 一键清空聊天记录
- 老年模式：更大字体、更高对比度
- 快捷问题按钮
- PWA manifest，可添加到手机桌面

## 本地启动

建议使用 Node.js 20，至少需要 Node.js 18.18。

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量文件：

```bash
cp .env.example .env.local
```

3. 修改 `.env.local`：

```bash
OPENROUTER_API_KEY=你的_OpenRouter_API_Key
OPENROUTER_MODEL=openrouter/owl-alpha
OPENROUTER_FALLBACK_MODELS=google/gemini-2.5-flash,openai/gpt-4o-mini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. 启动开发服务：

```bash
npm run dev
```

打开 `http://localhost:3000`。

## 如何申请 OpenRouter API Key

1. 打开 OpenRouter 官网：https://openrouter.ai/
2. 注册或登录账号
3. 进入 Keys / API Keys 页面
4. 创建一个新的 API Key
5. 将 API Key 填入 `.env.local` 的 `OPENROUTER_API_KEY`

## 如何更换模型

在 `.env.local` 修改：

```bash
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_FALLBACK_MODELS=openrouter/owl-alpha,openai/gpt-4o-mini
```

也可以换成 OpenRouter 支持的其他 Chat Completions 模型。修改后重启开发服务。

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 新建项目并导入仓库
3. 在 Vercel 项目的 Environment Variables 中添加：

```bash
OPENROUTER_API_KEY=你的_OpenRouter_API_Key
OPENROUTER_MODEL=openrouter/owl-alpha
OPENROUTER_FALLBACK_MODELS=google/gemini-2.5-flash,openai/gpt-4o-mini
NEXT_PUBLIC_SITE_URL=https://你的域名
```

4. 点击 Deploy

## 常见问题

### 为什么语音识别不可用？

语音识别依赖浏览器支持。Chrome、Edge 等浏览器支持较好，部分 iPhone Safari 或微信内置浏览器可能不可用。不可用时，页面会提示并显示文字输入。

### 为什么没有声音？

请先确认手机没有静音，浏览器音量正常，并允许网页播放声音。有些浏览器需要用户先点击页面按钮后才允许朗读。

### 为什么 AI 没有回复？

通常是网络慢、OpenRouter API Key 没配置、余额不足或模型不可用。请检查 `.env.local` 中的 `OPENROUTER_API_KEY` 和 `OPENROUTER_MODEL`，修改后重启服务。

### 如何更换模型？

修改 `.env.local` 的 `OPENROUTER_MODEL`。例如：

```bash
OPENROUTER_MODEL=google/gemini-2.5-flash
```

如果某个模型不可用，换成 OpenRouter 控制台里可用的模型名称即可。
