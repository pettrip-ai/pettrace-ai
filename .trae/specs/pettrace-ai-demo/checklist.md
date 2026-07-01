# 宠迹AI Demo — 验证 Checklist

- [x] C1: `npm run build` 零错误零 warning（Task 1 完成时）
- [x] C2: Mock 地点数据对四城市每市 ≥ 8 条、类型覆盖景点/酒店/餐厅/商场/乐园、每条含完整宠物规则字段（Task 1）
- [x] C3: 375px / 768px / 1440px 三断点下四条 Tab 都可见且可点（Task 2）
- [x] C4: 关闭浏览器、重新打开、设置项/对话历史/验证记录/宠物档案全部保留（Task 2+4+3+5）
- [x] C5: 地图 Marker 点击弹出卡片含验证人数 / 一致性评分 / 最近验证时间 三项（Task 3）
- [x] C6: 点"我验证了"后该地点验证人数 +1，再次进入地图可见变化（Task 3）
- [x] C7: AI Tab 默认未勾选"使用档案宠物"时，Mock/真实 AI 都不接收任何档案字段；勾选后才拼入（Task 4+5）
- [x] C8: Mock AI 离线（拔网线 + 不配 key）时可返回结构化行程 JSON（Task 4）
- [x] C9: 真实 AI 路径走 OpenAI Chat Completions 兼容协议，错误时回退 Mock 并友好提示（Task 4）
- [x] C10: 结构化行程卡片点击可跳地图并高亮对应 Marker（Task 3+4）
- [x] C11: 档案页底部明确显示"默认私密 · 不会自动同步到任何平台"文案（Task 5）
- [ ] C12: 冷启动后走完"地图搜点 → AI 规划 → 验证 → 社区打卡 → 查看宠物档案"全流程无白屏无崩溃（Task 6）
- [ ] C13: 颜色对比度（wcag AA）检查通过（Task 6）
- [ ] C14: `npm run dev` 首屏 < 3s（localhost）（Task 6）
- [ ] C15: `npm run build` 后 Vercel/Netlify 部署成功（Task 6）
