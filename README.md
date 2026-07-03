# 宠迹AI — PetTrace AI

> 让每一次携宠出行更安心 · TRAE AI 创造力大赛参赛作品

## 🌟 在线体验

[https://pettrip-ai.github.io/pettrace-ai/](https://pettrip-ai.github.io/pettrace-ai/)

## 📦 功能

- 🗺️ **宠物友好地图**：上海/北京/广州/成都四市，每个地点含体型限制、是否可进室内、牵引要求、费用、室外座位等规则，用户可实时验证更新。
- 🤖 **AI 行程规划**：对话式输入目的地 / 日期 / 宠物特征，AI 输出结构化行程（日期分段 · 交通 · 推荐地点 · 风险 · 行前清单），点击可直接在地图高亮对应 Marker。
- 📯 **真实验证社区**：打卡 / 游记 / 避雷 / 经验分享，每条地点信息附验证时间、验证人数、一致性评分。
- 🐾 **宠物私密档案**：默认本地私密，记录驱虫/疫苗/洗澡/体检日程，到期提醒；需用户主动勾选"使用档案宠物"才喂给 AI。
- 🔒 **零登录 · 零后端** · 所有数据保存在浏览器 LocalStorage。

## 🛠️ 技术栈

- **框架**：Vite 8 + React 19 + TypeScript
- **样式**：Tailwind CSS 3.4
- **路由**：React Router DOM 7
- **地图**：Leaflet + react-leaflet 5
- **图标**：Lucide React
- **状态管理**：Zustand 5
- **AI 兼容**：OpenAI Chat Completions 协议（支持 OpenAI / DeepSeek / Moonshot / 通义千问）

## 🚀 快速启动

```bash
npm install
npm run dev     # 本地开发，默认 Mock AI
npm run build   # 生产构建（输出 dist/）
```

## 🔑 切换到真实 AI

打开"设置" → 选择 Provider（OpenAI / DeepSeek / Moonshot / DashScope / 自定义）→ 填 API Key → 关闭"Mock AI"开关。未配置时自动走 Mock 规则引擎。

## 📴 离线可用

地图瓦片使用 OpenStreetMap（公共可缓存），AI 默认 Mock 引擎，无网络也可完整演示四大模块。

## 📁 文档目录

项目相关文档已统一整理在 [`docs/`](./docs) 下：

| 路径 | 说明 |
| --- | --- |
| [`docs/spec/`](./docs/spec) | Spec 规划文档：PRD (`spec.md`)、实现计划 (`tasks.md`)、验证清单 (`checklist.md`) |
| [`docs/REFACTOR_SPEC.md`](./docs/REFACTOR_SPEC.md) | UI 与设计系统完整重构规格 |
| [`docs/images/`](./docs/images) | 图片素材 |
| [`docs/trae/`](./docs/trae) | Trae 相关截图（预留） |
| [`docs/pettrace-ai-signup-standalone.html`](./docs/pettrace-ai-signup-standalone.html) | 报名帖 HTML |
| [`docs/宠迹AI-TRAE创造力大赛报名帖.docx`](./docs/%E5%AE%A0%E8%BF%B9AI-TRAE%E5%88%9B%E9%80%A0%E5%8A%9B%E5%A4%A7%E8%B5%9B%E6%8A%A5%E5%90%8D%E5%B8%96.docx) | 报名帖原始 docx |
| [`docs/dist.zip`](./docs/dist.zip) | 构建产物包（解压即可用静态服务器预览） |

## 📋 数据隐私

本项目所有数据均存储在浏览器 LocalStorage，无任何云端上传，无需登录，零后端依赖。

---

**参赛赛道**：生活娱乐  
**报名链接**：[https://forum.trae.cn/t/topic/43184](https://forum.trae.cn/t/topic/43184)
