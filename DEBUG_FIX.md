# 翻译结果不显示 & 卡死问题修复

## 问题1: 翻译结果不显示
快速模式和专业模式都显示"翻译成功"，但译文区域没有内容填充。

### 根本原因
1. `createTask` 函数没有返回创建的 task 对象
2. `handleTranslate` 中使用 `currentTask` 时可能还未更新到最新状态
3. 缺少调试日志，难以追踪数据流

### 修复内容
- ✅ `createTask` 现在返回创建的 task 对象
- ✅ 更新接口类型定义，返回值类型为 `TranslationTask`
- ✅ 在 `updateTaskResult` 中添加调试日志
- ✅ 使用 `createTask` 返回的 task 对象，而不是依赖 `currentTask` 状态
- ✅ 添加详细的调试日志追踪翻译流程

## 问题2: 专业翻译卡死，刷新后仍然卡住
页面刷新或重启系统后，进度仍然显示卡死前的状态，且无法输入文本。

### 根本原因
Zustand 的 persist 中间件将 `isTranslating` 和 `progress` 等运行时状态保存到了浏览器 localStorage 中。当翻译过程中出现错误或网络问题时，这些状态会被持久化，导致页面刷新后仍然处于"翻译中"状态。

### 修复内容

#### 1. 修改持久化策略 (`translationStore.ts`)
```typescript
{
  name: 'translation-storage',
  // 只持久化 tasks，不持久化运行时状态
  partialize: (state) => ({
    tasks: state.tasks,
  }),
  // 自定义 merge 策略，确保运行时状态始终重置
  merge: (persistedState: any, currentState) => ({
    ...currentState,
    tasks: persistedState?.tasks || [],
    // 强制重置运行时状态
    currentTask: null,
    isTranslating: false,
    progress: { stage: 'idle', progress: 0 },
  }),
}
```

#### 2. 添加启动时状态检查 (`Translation.tsx`)
```typescript
// 组件加载时，确保清理任何卡住的状态
useEffect(() => {
  console.log('[Init] Checking translation state on mount');
  if (isTranslating) {
    console.log('[Init] Found stuck isTranslating=true, resetting...');
    setIsTranslating(false);
    updateProgress({ stage: 'idle', progress: 0 });
    toast.warning('检测到未完成的翻译任务，已重置状态');
  }
}, []);
```

## 立即修复方法（如果仍然卡住）

如果你现在仍然处于卡住状态，有两种快速解决方法：

### 方法1: 清除浏览器存储（推荐）
1. 打开浏览器开发者工具（F12）
2. 切换到 "Application" 或 "应用程序" 标签
3. 左侧找到 "Local Storage" → 选择你的网站
4. 找到 `translation-storage` 键，删除它
5. 刷新页面

### 方法2: 在控制台手动重置
1. 打开浏览器开发者工具（F12）
2. 切换到 "Console" 标签
3. 输入以下代码并回车：
```javascript
localStorage.removeItem('translation-storage');
location.reload();
```

## 现在的行为

修复后的行为：
- ✅ 只有翻译历史（tasks）会被持久化
- ✅ `isTranslating`、`currentTask`、`progress` 等运行时状态不会被持久化
- ✅ 页面刷新后自动重置为空闲状态
- ✅ 如果检测到卡住状态，会自动重置并提示用户
- ✅ 文本输入框始终可用（除非正在翻译中）

## 预期结果
- 翻译完成后，译文应该立即显示在右侧区域
- 快速模式：直接显示最终翻译
- 专业模式：进度卡片中显示中间步骤，最后在右侧显示最终翻译
- 页面刷新后不会保留"翻译中"状态

## 调试步骤

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 输入文本并点击"开始翻译"
4. 观察以下日志输出：
   ```
   Created task: { id: '...', sourceText: '...', ... }
   Translation result: { finalTranslation: '...' }
   Updating task: '...' with result: { finalTranslation: '...' }
   [Store] updateTaskResult called with: { taskId: '...', result: { ... } }
   [Store] Updated currentTask: { ..., result: { ... } }
   Updated task in store: { ..., result: { ... } }
   [Render] currentTask: { ..., result: { ... } }
   [Render] finalTranslation: '...'
   ```

## 如果问题仍然存在

检查控制台日志中的以下内容：
1. `[Init]` 日志是否显示检测到卡住状态？
2. `Translation result` 是否包含 `finalTranslation` 字段？
3. `[Store] Updated currentTask` 中 `result` 是否正确？
4. `[Render] finalTranslation` 是否有值？

如果某个步骤没有输出预期内容，说明问题出在该步骤。
