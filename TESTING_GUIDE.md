# 领域自适应翻译功能 - 快速测试指南

## 测试前准备

1. 确保已配置大模型 API
2. 启动开发服务器: `npm run dev`
3. 打开浏览器访问 `http://localhost:3000`

## 测试用例

### 测试用例 1: 技术文档(推荐)

**输入文本**:
```
深度学习模型通过反向传播算法优化损失函数,使用梯度下降更新神经网络的权重参数。卷积神经网络(CNN)特别适合处理图像数据,而循环神经网络(RNN)更擅长序列建模。Transformer架构通过自注意力机制实现了并行化计算,显著提升了训练效率。
```

**预期结果**:
- 领域识别: 技术 - 人工智能/深度学习
- 术语数量: 10-15 个
- 关键术语示例:
  - 深度学习 → Deep Learning
  - 反向传播 → Backpropagation
  - 卷积神经网络 → Convolutional Neural Network
  - Transformer → Transformer (保持不变)

---

### 测试用例 2: 法律文本

**输入文本**:
```
甲方与乙方经友好协商,就软件开发服务事宜达成如下协议。双方应遵守《中华人民共和国合同法》的相关规定。甲方有权在发现乙方违约时单方面解除合同,并要求乙方承担违约责任。本协议一式两份,双方各执一份,具有同等法律效力。
```

**预期结果**:
- 领域识别: 法律 - 合同法
- 术语数量: 8-12 个
- 关键术语示例:
  - 甲方 → Party A
  - 乙方 → Party B
  - 违约责任 → Liability for Breach of Contract

---

### 测试用例 3: 医疗文本

**输入文本**:
```
患者主诉胸痛三天,伴有呼吸困难。体格检查:血压 140/90 mmHg,心率 98 次/分。辅助检查:心电图显示 ST 段抬高,血清肌钙蛋白 I 升高。初步诊断:急性心肌梗死。建议立即行冠状动脉造影检查,必要时进行经皮冠状动脉介入治疗(PCI)。
```

**预期结果**:
- 领域识别: 医疗 - 心血管
- 术语数量: 12-18 个
- 关键术语示例:
  - 急性心肌梗死 → Acute Myocardial Infarction
  - 心电图 → Electrocardiogram (ECG)
  - 经皮冠状动脉介入治疗 → Percutaneous Coronary Intervention

---

## 测试步骤

### 1. UI 测试

1. 进入翻译页面
2. 确认翻译模式选项中有"领域自适应"
3. 选择"领域自适应"模式
4. 粘贴测试文本
5. 点击"开始翻译"

### 2. 进度弹窗测试

确认弹窗中显示以下内容:

- ✅ 标题: "领域自适应翻译进行中"
- ✅ 5 个阶段全部显示:
  1. 领域识别 (图标: Brain)
  2. 术语生成 (图标: BookText)
  3. 初步翻译 (图标: Languages)
  4. 问题分析 (图标: FileSearch)
  5. 精准优化 (图标: Sparkles)
- ✅ 每个阶段有加载动画和进度百分比
- ✅ 完成的阶段显示绿色勾选
- ✅ 领域识别完成后显示识别结果
- ✅ 术语生成完成后显示术语数量
- ✅ 底部显示整体进度条

### 3. 控制台日志测试

打开浏览器开发者工具,检查控制台输出:

```
[DomainAdaptive] Domain identified: { primaryDomain: "技术", subDomain: "人工智能", confidence: 0.95, ... }
[DomainAdaptive] Terminology generated: 12 terms
[DomainAdaptive] Direct translation completed
[DomainAdaptive] Issues analysis completed: 5 issues found
[DomainAdaptive] Final translation completed
```

### 4. 结果验证

翻译完成后:
- ✅ 译文区域显示最终翻译结果
- ✅ 专业术语翻译准确且一致
- ✅ 可点击"段落对照"查看原文和译文对比
- ✅ 无控制台错误

---

## 性能基准

以 200 字技术文档为例(使用 GPT-4):

| 阶段 | 预计耗时 | 说明 |
|------|---------|------|
| 领域识别 | 3-5 秒 | 返回 JSON,速度快 |
| 术语生成 | 5-10 秒 | 需要生成 JSON 数组 |
| 初步翻译 | 8-15 秒 | 流式输出 |
| 问题分析 | 3-5 秒 | 非流式 |
| 精准优化 | 8-15 秒 | 流式输出 |
| **总计** | **27-50 秒** | 取决于网络和 LLM 速度 |

---

## 常见问题排查

### 问题 1: 弹窗没有出现

**可能原因**:
- 选择的不是"领域自适应"模式
- 检查 `setShowDomainAdaptiveModal` 是否被正确调用

**解决方案**:
```javascript
// 在 Translation.tsx 中检查
console.log('Selected mode:', mode);
console.log('Actual mode:', actualMode);
```

### 问题 2: 卡在某个阶段不动

**可能原因**:
- LLM API 请求超时
- JSON 解析失败

**解决方案**:
```javascript
// 检查控制台是否有错误日志
// 查看 DomainAdaptiveTranslationService.ts 中的 try-catch
```

### 问题 3: 术语表为空

**可能原因**:
- 文本中专业术语确实较少
- LLM 返回格式不符合预期

**解决方案**:
- 使用包含更多专业术语的测试文本
- 检查 `generateTerminology` 方法的 JSON 解析逻辑

### 问题 4: TypeScript 编译错误

**可能原因**:
- 类型定义不匹配

**解决方案**:
```bash
# 清理并重新构建
npm run build
```

---

## 验收标准

功能完整性检查清单:

- [ ] UI 中"领域自适应"选项可见且可选
- [ ] 选择该模式后,点击翻译能正常触发
- [ ] 进度弹窗能正确显示 5 个阶段
- [ ] 领域识别结果在弹窗中正确显示
- [ ] 术语数量在弹窗中正确显示
- [ ] 每个阶段的进度百分比实时更新
- [ ] 翻译完成后弹窗自动关闭
- [ ] 最终翻译结果正确显示在译文区域
- [ ] 无控制台错误或警告
- [ ] 专业术语翻译准确且一致

性能检查清单:

- [ ] 整体翻译时间在可接受范围内(< 60 秒)
- [ ] 流式输出(直译、意译阶段)能实时显示
- [ ] 进度条动画流畅,无卡顿
- [ ] 多次翻译不会出现状态混乱

---

## 下一步

测试通过后,可以:

1. **部署到生产环境**
   ```bash
   npm run build
   vercel deploy
   ```

2. **更新 README.md**
   - 添加"领域自适应"模式说明
   - 更新功能特性列表

3. **用户培训**
   - 分享 DOMAIN_ADAPTIVE_GUIDE.md
   - 提供测试用例供用户试用

4. **监控和优化**
   - 收集用户反馈
   - 优化 Prompt 提升识别准确度
   - 根据实际使用情况调整术语生成策略

---

## 技术债务

当前简化实现,未来可优化:

1. **缓存机制**: 相同文本重复翻译时,复用领域和术语结果
2. **错误重试**: LLM 调用失败时自动重试
3. **可配置性**: 允许用户调整各阶段的 Prompt
4. **A/B 测试**: 对比不同领域识别策略的效果
5. **翻译质量评估**: 自动评估译文质量并打分

---

## 贡献指南

如需改进功能,请:

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/domain-adaptive-improvements`
3. 提交更改: `git commit -m "feat: improve domain identification accuracy"`
4. 推送分支: `git push origin feature/domain-adaptive-improvements`
5. 创建 Pull Request

---

**祝测试顺利! 🎉**
