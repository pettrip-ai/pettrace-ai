# Task 5 CommunityPage + PetPage 实施清单

## [x] Task 1: types.ts 补 FeedType/FeedItem/CareTaskType/CareTask/ItineraryStep
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - FeedType='打卡'|'游记'|'避雷'|'经验分享'
  - FeedItem {id, placeId, type, text, whenISO, byUser, likes, likedByMe?, placeName?}
  - CareTaskType + CareTask
  - ItineraryStep / Itinerary
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-1.1: tsc --noEmit 可解析这些类型
  - `human-judgement` TR-1.2: 定义与 Task 5 设计一致
- **Notes**: 已完成（前序会话）

## [x] Task 2: useStore.ts 补 feeds/pets/careTasks/verifyPlace/showPetInChat
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - seedFeeds() 8-10 条真实 Place Feed
  - addFeed / likeFeed / unlikeFeed
  - addPet（自动 defaultCareTasksFor）/ updatePet / removePet
  - addCareTask / updateCareTask / removeCareTask
  - verifyPlace(placeId, verdict='good'|'bad'|'expired') 内部 updatePlace + addVerification + 自动 addFeed
  - showPetInChat / setShowPetInChat
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-5
- **Test Requirements**:
  - `programmatic` TR-2.1: store.getState().feeds.length >= 8
  - `programmatic` TR-2.2: store.addFeed({...}) 后 feeds+1
  - `programmatic` TR-2.3: addPet 后自动有 6 条默认护理任务
- **Notes**: 已完成（前序会话）

## [x] Task 3: CommunityPage（Feed 列表 + 筛选 + 城市 tab + FAB + PostModal + Toast）
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - 完整覆盖 CommunityPage.tsx
  - 本地 Toast 状态 + window.dispatchEvent('tp-show-toast') 跨组件
  - useStore.sets 联动 setCity / setHighlightPlaceId 再 navigate('/map')
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-5
- **Test Requirements**:
  - `programmatic` TR-3.1: 渲染 feed 卡片数 === store.feeds.length
  - `human-judgement` TR-3.2: 卡片样式符合 bg-white rounded-xl border-rule p-4 my-3 shadow-sm
- **Notes**: 已完成

## [x] Task 4: PetPage（宠物卡 + 编辑 Modal + 护理日程 + 私密提示 + showPetInChat toggle）
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - 宠物卡 rounded-2xl bg-bg2 border-rule
  - 编辑 Modal 复用
  - 护理日程 nextISO + statusChip 三种状态
  - 红色私密条 + 底部 toggle（与 AiPage 文案"使用档案宠物 {petName} 参与规划"保持一致）
- **Acceptance Criteria Addressed**: AC-3, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-4.1: 渲染宠物卡片数 === store.pets.length
  - `programmatic` TR-4.2: statusChip 返回三种状态文本之一
- **Notes**: 已完成

## [x] Task 5: 构建与类型检查
- **Priority**: high
- **Depends On**: Task 3, Task 4
- **Description**: npm run build + tsc --noEmit 退出码 0；清掉 mockAiEngine.ts 未使用变量警告 & AiPage.tsx 类型（ChatMessage.structured 从 ItineraryStep[] 改回 AiReply）
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-5.1: npm run build exit=0
  - `programmatic` TR-5.2: npx tsc --noEmit exit=0
- **Notes**: 已完成
