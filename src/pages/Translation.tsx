import { useEffect, useMemo, useRef, useState } from 'react';
import { TranslationMode, OutputFormat, Language } from '../types';
import type { TranslationProgress } from '../stores/translationStore';
import { useTranslationStore } from '../stores/translationStore';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { useDomainStore } from '../stores/domainStore';
import { TranslationService } from '../services/translation/TranslationService';
import { detectLanguage } from '../utils/languageDetector';
import { shouldUseProfessionalMode } from '../utils/translationOptimizer';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Segmented, SegmentedItem } from '../components/ui/segmented';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select-radix';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  CopyButton,
  MODE_META,
  ModePicker,
  ProgressStrip,
} from '../components/translation/WorkbenchParts';
import { ProfessionalTranslationModal } from '../components/translation/ProfessionalTranslationModal';
import { DomainAdaptiveTranslationModal } from '../components/translation/DomainAdaptiveTranslationModal';
import { TranslationReport } from '../components/translation/TranslationReport';
import { ParagraphComparisonModal } from '../components/translation/ParagraphComparisonModal';
import { alignParagraphs, countParagraphs } from '../utils/paragraphs';
import { toast } from 'sonner';
import { ArrowLeftRight, Clipboard, Columns3, FileText, Loader2, Sparkles, Trash2, TriangleAlert } from 'lucide-react';
import { cn } from '../lib/utils';

const AUTO = '__auto__';
const GENERAL = '__general__';

/** 各模式的阶段定义：key 与 TranslationProgress.stage 对齐 */
const STAGES: Record<TranslationMode, { key: string; label: string }[]> = {
  [TranslationMode.QUICK]: [{ key: 'final', label: '单次直译' }],
  [TranslationMode.PROFESSIONAL]: [
    { key: 'direct', label: '直译打底' },
    { key: 'issues', label: '批评审校' },
    { key: 'final', label: '意译定稿' },
  ],
  [TranslationMode.DOMAIN_ADAPTIVE]: [
    { key: 'domain', label: '识别领域' },
    { key: 'terminology', label: '锁定术语' },
    { key: 'direct', label: '直译打底' },
    { key: 'issues', label: '批评审校' },
    { key: 'final', label: '术语精修' },
  ],
};

/** 分段对齐：与顶部「N 段」统计、段落对照浮层共用同一口径（见 utils/paragraphs） */
const toPairs = alignParagraphs;

function estimateTokens(text: string) {
  const chars = [...text].length;
  if (!chars) return 0;
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
  return Math.max(1, Math.round(cjk / chars > 0.15 ? chars * 0.75 : chars / 3.6));
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

function Translation() {
  const [sourceText, setSourceText] = useState('');
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.QUICK);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(OutputFormat.BILINGUAL);
  const [selectedDomainId, setSelectedDomainId] = useState<string>(AUTO);
  /** null = 由 detectLanguage 决定；否则为用户显式指定的源语言 */
  const [sourceLangOverride, setSourceLangOverride] = useState<Language | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showParagraphComparison, setShowParagraphComparison] = useState(false);
  const [confirmReset, setConfirmReset] = useState<null | 'mode' | 'all'>(null);
  /** 正在运行 / 最近一次运行的模式，供进度浮层取用（避免与当前选中模式串台） */
  const [runningMode, setRunningMode] = useState<TranslationMode | null>(null);

  const {
    createTask,
    updateTaskResult,
    setIsTranslating,
    updateProgress,
    getModeState,
    resetMode,
    resetAllModes,
  } = useTranslationStore();
  const { getActiveConfig } = useLLMConfigStore();
  const { categories, getCategoryById } = useDomainStore();

  const modeState = getModeState(mode);
  const { currentTask, isTranslating, progress } = modeState;

  /**
   * 原实现在这里有一个 useEffect：切换模式即 setIsTranslating(false) 并弹出
   * 「检测到未完成的翻译任务，已重置状态」。它有两个问题：
   *  1) store 的 partialize 只持久化 tasks，isTranslating 不可能跨刷新为 true，
   *     所以该守卫是死代码；
   *  2) 三种模式的结果本来就是隔离存储的，切模式不该清空别人的结果。
   * 现在改为「保留各模式结果 + 标注结果归属」，见 §P0-4。
   */

  const detected = sourceText.trim() ? detectLanguage(sourceText) : null;
  const effectiveSourceLang = sourceLangOverride ?? detected;
  const toEnglish = effectiveSourceLang === Language.ZH_CN;
  const sourceLangName = effectiveSourceLang ? (toEnglish ? '中文' : '英文') : '自动识别';
  const targetLangName = effectiveSourceLang ? (toEnglish ? '英文' : '中文') : '中 / 英';

  const displayResult = currentTask?.result?.finalTranslation || '';
  const pairs = useMemo(
    () => (displayResult ? toPairs(sourceText || currentTask?.sourceText || '', displayResult) : []),
    [displayResult, sourceText, currentTask?.sourceText]
  );
  const copyText = useMemo(() => {
    if (!displayResult) return '';
    return outputFormat === OutputFormat.BILINGUAL
      ? pairs.map((p) => `${p.source}\n${p.target}`).join('\n\n')
      : displayResult;
  }, [displayResult, outputFormat, pairs]);

  const stale = !!displayResult && (currentTask?.sourceText ?? '') !== sourceText;
  const willDowngrade =
    mode === TranslationMode.PROFESSIONAL &&
    !!sourceText.trim() &&
    !shouldUseProfessionalMode(sourceText);

  const hasResult: Partial<Record<TranslationMode, boolean>> = {
    [TranslationMode.QUICK]: !!getModeState(TranslationMode.QUICK).currentTask?.result,
    [TranslationMode.PROFESSIONAL]: !!getModeState(TranslationMode.PROFESSIONAL).currentTask?.result,
    [TranslationMode.DOMAIN_ADAPTIVE]: !!getModeState(TranslationMode.DOMAIN_ADAPTIVE).currentTask?.result,
  };

  const canShowReport =
    (mode === TranslationMode.PROFESSIONAL || mode === TranslationMode.DOMAIN_ADAPTIVE) &&
    !!currentTask?.result &&
    !isTranslating;
  const canShowProcess =
    mode !== TranslationMode.QUICK &&
    (isTranslating || progress.progress > 0 || !!currentTask?.result);

  /** 领域选项：一级作为分组，二级作为可选项；带提示词的才真正影响翻译 */
  const domainGroups = useMemo(() => {
    const level1 = categories.filter((c) => c.level === 1);
    return level1
      .map((parent) => ({
        parent,
        children: categories.filter((c) => c.parentId === parent.id),
      }))
      .filter((g) => g.children.length > 0 || !!g.parent.prompt);
  }, [categories]);
  const hasCustomDomains = domainGroups.some((g) => g.children.length > 0 || !!g.parent.prompt);

  /* ---------------------------- 翻译主流程 ---------------------------- */
  const handleTranslate = async () => {
    if (isTranslating) return;
    if (!sourceText.trim()) {
      toast.error('请输入需要翻译的文本');
      return;
    }
    const activeConfig = getActiveConfig();
    if (!activeConfig) {
      toast.error('请先在设置页面配置大模型');
      return;
    }

    // 短文本自动降级为快速模式（该机制为刻意保留项，见 docs/OPTIMIZATION_ROLLBACK.md）
    let actualMode = mode;
    if (mode === TranslationMode.PROFESSIONAL && !shouldUseProfessionalMode(sourceText)) {
      actualMode = TranslationMode.QUICK;
      toast.info('短文本已按极速直译处理，以节省等待时间', { duration: 3000 });
    }

    setRunningMode(actualMode);
    const newTask = createTask(sourceText, actualMode, outputFormat, 
      selectedDomainId === AUTO || selectedDomainId === GENERAL ? undefined : selectedDomainId
    );
    // 必须在 createTask 之后再置位：createTask 会把该模式的 isTranslating 重置为 false
    setIsTranslating(actualMode, true);
    updateProgress(actualMode, { stage: 'idle', progress: 0 });
    if (actualMode !== TranslationMode.QUICK) setShowProcessModal(true);

    try {
      let result;

      if (actualMode === TranslationMode.DOMAIN_ADAPTIVE) {
        const { DomainAdaptiveTranslationService } = await import(
          '../services/translation/DomainAdaptiveTranslationService'
        );
        const service = new DomainAdaptiveTranslationService(activeConfig);

        const onProgress = (
          stage: 'domain' | 'terminology' | 'direct' | 'issues' | 'final',
          stageProgress: number,
          // service 侧签名是 result?: any，这里保持 any，避免把 unknown 灌进强类型字段
          stageResult?: any
        ) => {
          const cur = useTranslationStore.getState().getModeState(actualMode).progress;
          const overall =
            stage === 'final' && stageProgress >= 100
              ? 100
              : Math.min(99, Math.round(({ domain: 0, terminology: 20, direct: 40, issues: 60, final: 80 }[stage]) + stageProgress / 5));

          updateProgress(actualMode, {
            stage: stageProgress >= 100 && stage === 'final' ? 'idle' : stage,
            progress: overall,
            domainInfo: stage === 'domain' && stageResult ? stageResult : cur.domainInfo,
            terminology: stage === 'terminology' && stageResult ? stageResult : cur.terminology,
            directTranslation: stage === 'direct' && stageResult ? stageResult : cur.directTranslation,
            issues: stage === 'issues' && stageResult ? stageResult : cur.issues,
            finalTranslation: stage === 'final' && stageResult ? stageResult : cur.finalTranslation,
          });
        };

        result = await service.translate(sourceText, sourceLangOverride ?? undefined, onProgress);
      } else {
        const domainPrompt =
          selectedDomainId && selectedDomainId !== AUTO
            ? getCategoryById(selectedDomainId)?.prompt
            : undefined;

        const service = new TranslationService(activeConfig, domainPrompt);

        const onProgress = (
          stage: 'direct' | 'issues' | 'final',
          stageProgress: number,
          stageResult?: any
        ) => {
          const cur = useTranslationStore.getState().getModeState(actualMode).progress;
          const overall =
            stage === 'final' && stageProgress >= 100
              ? 100
              : Math.min(99, ({ direct: 0, issues: 33, final: 66 }[stage]) + stageProgress / 3);

          updateProgress(actualMode, {
            stage: stageProgress >= 100 && stage === 'final' ? 'idle' : stage,
            progress: overall,
            directTranslation: stage === 'direct' && stageResult ? stageResult : cur.directTranslation,
            issues: stage === 'issues' && stageResult ? stageResult : cur.issues,
            finalTranslation: stage === 'final' && stageResult ? stageResult : cur.finalTranslation,
          });
        };

        result = await service.translate(
          sourceText,
          actualMode,
          sourceLangOverride ?? undefined,
          onProgress
        );
      }

      updateTaskResult(actualMode, newTask.id, result);
      toast.success('翻译完成');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Translation error:', error);
      toast.error(`翻译失败：${message}`);
      setShowProcessModal(false);
    } finally {
      setIsTranslating(actualMode, false);
    }
  };

  /* ------------------------- Ctrl / Cmd + Enter ------------------------- */
  const runRef = useRef(handleTranslate);
  runRef.current = handleTranslate;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ------------------------------ 事件 ------------------------------ */
  const switchLangDirection = () => {
    const current = effectiveSourceLang ?? Language.EN;
    setSourceLangOverride(current === Language.ZH_CN ? Language.EN : Language.ZH_CN);
  };

  const doReset = (scope: 'mode' | 'all') => {
    if (scope === 'all') {
      resetAllModes();
      setSourceText('');
      toast.success('已清空三种模式的全部结果');
    } else {
      resetMode(mode);
      toast.success(`已清空「${MODE_META[mode].label}」的结果`);
    }
    setConfirmReset(null);
  };

  const sourceChars = [...sourceText].length;
  const sourceParas = countParagraphs(sourceText);
  const runModeState = runningMode ? getModeState(runningMode) : null;
  const runProgress: TranslationProgress = runModeState?.progress ?? progress;

  return (
    <div className="space-y-5">
      {/* ---------------- 页头 ---------------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-[1.8rem] leading-[1.25] font-bold tracking-[-0.01em] text-ink">
            智能双语工作台
            <span className="ml-2 font-brand text-[1.4rem] font-normal italic text-muted">
              Zh ↔ En
            </span>
          </h1>
          <p className="m-0 text-[14.5px] leading-relaxed text-muted">
            直译 → 批评审校 → 意译定稿，推理过程可见、术语按领域锁定。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center gap-2 rounded-full border border-border bg-surface px-2.5 text-[12.5px] text-muted">
            <span className="font-mono text-ink">{sourceLangName}</span>
            <span aria-hidden className="text-accent">→</span>
            <span className="font-mono text-ink">{targetLangName}</span>
            <button
              type="button"
              onClick={() => setSourceLangOverride(null)}
              className={sourceLangOverride ? 'font-semibold text-accent-strong hover:underline' : 'hidden'}
            >
              改回自动
            </button>
          </span>
          {willDowngrade && (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent/45 bg-accent-tint px-2.5 text-[12.5px] text-ink">
              <TriangleAlert className="size-3.5 text-accent-strong" />
              短文本将按极速直译处理
            </span>
          )}
        </div>
      </header>

      {/* ---------------- 配置区 ---------------- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <div className="min-w-[320px] flex-1">
            <Label className="mb-2 block">翻译模式</Label>
            <ModePicker
              value={mode}
              onChange={setMode}
              disabled={isTranslating}
              hasResult={hasResult}
            />
          </div>

          <div>
            <Label className="mb-2 block">
              输出格式
            </Label>
            <Segmented
              id="output-format"
              aria-label="输出格式"
              value={outputFormat}
              onValueChange={(v) => setOutputFormat(v as OutputFormat)}
            >
              <SegmentedItem value={OutputFormat.BILINGUAL}>分段对照</SegmentedItem>
              <SegmentedItem value={OutputFormat.TRANSLATION_ONLY}>纯译文</SegmentedItem>
            </Segmented>
            <p className="mt-2 max-w-[26ch] text-xs leading-[1.6] text-muted">
              对照＝每段先原文后译文；纯译文只输出结果。
            </p>
          </div>

          <div>
            <Label htmlFor="domain-select" className="mb-2 block">
              领域约束
            </Label>
            <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
              <SelectTrigger id="domain-select" className="h-9 w-[220px] text-[13.5px]">
                <SelectValue placeholder="选择领域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUTO}>
                  自动识别{mode === TranslationMode.DOMAIN_ADAPTIVE ? '（该模式必需）' : ''}
                </SelectItem>
                <SelectItem value={GENERAL}>通用领域（不加专业约束）</SelectItem>
                {domainGroups.map((g) => (
                  <SelectGroup key={g.parent.id}>
                    <SelectLabel>{g.parent.name}</SelectLabel>
                    {g.parent.prompt ? (
                      <SelectItem value={g.parent.id}>{g.parent.name}（整体约束）</SelectItem>
                    ) : null}
                    {g.children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.prompt ? '' : '（未配置提示词）'}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {!hasCustomDomains && (
              <p className="mt-2 max-w-[26ch] text-xs leading-[1.6] text-muted">
                目前仅有内置分类；领域管理页尚未恢复，暂无法自定义提示词。
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ---------------- 工作台 ---------------- */}
      <Card className="relative overflow-hidden p-0 shadow-lg">
        {isTranslating && (
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-accent via-accent-strong to-accent progress-flow-bar z-10" />
        )}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border bg-surface-1 px-4 py-2.5">
          <span className="text-[13px] font-semibold text-ink">语言方向</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 text-[13px] font-semibold text-ink shadow-2xs">
            {sourceLangName}
            <button
              type="button"
              onClick={switchLangDirection}
              aria-label="互换语言方向"
              className="rounded-full p-1 text-accent-strong transition-colors hover:bg-accent-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ArrowLeftRight className="size-3.5" />
            </button>
            {targetLangName}
          </span>
          <span className="font-mono text-[11.5px] text-muted">
            {sourceChars} 字符{sourceParas ? ` · ${sourceParas} 段` : ''} · ≈{estimateTokens(sourceText)} tokens
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[12px] text-muted">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10.5px] font-medium shadow-2xs">
              {isMac ? '⌘' : 'Ctrl'}
            </kbd>
            <span aria-hidden className="text-muted/60">+</span>
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10.5px] font-medium shadow-2xs">
              Enter
            </kbd>
            <span className="ml-0.5">开始翻译</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-2">
          {/* 原文 */}
          <div className="flex min-h-[380px] flex-col bg-surface">
            <div className="flex h-11 items-center gap-2 border-b border-border bg-surface-1 px-4">
              <span className="text-[13px] font-bold text-ink">原文</span>
              <span className="ml-auto flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-7.5 px-2.5 text-[12px] text-muted hover:bg-accent-tint hover:text-ink gap-1"
                  onClick={async () => {
                    try {
                      const t = await navigator.clipboard.readText();
                      if (t) {
                        setSourceText(t);
                        toast.success('已粘贴剪贴板内容');
                      }
                    } catch {
                      toast.error('无法读取剪贴板：请手动粘贴');
                    }
                  }}
                >
                  <Clipboard className="size-3.5 text-muted" />
                  粘贴
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={!sourceText || isTranslating}
                  className="h-7.5 px-2.5 text-[12px] text-muted hover:bg-accent-tint hover:text-ink disabled:pointer-events-none disabled:opacity-40 gap-1"
                  onClick={() => setSourceText('')}
                >
                  <Trash2 className="size-3.5 text-muted" />
                  清空
                </Button>
              </span>
            </div>
            <Textarea
              id="source-text"
              aria-label="原文"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              disabled={isTranslating}
              placeholder="在此粘贴或输入需要翻译的文本…"
              className="min-h-0 flex-1 rounded-none border-0 bg-transparent text-[15px] focus-visible:ring-0"
            />
          </div>

          {/* 译文：空态 / 进行中 / 完成 三态互斥 */}
          <div className="flex min-h-[380px] flex-col bg-surface">
            <div className="flex h-11 items-center gap-2 border-b border-border bg-surface-1 px-4">
              <span className="text-[13px] font-bold text-ink">译文</span>
              {displayResult && currentTask && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-tint px-2 py-0.5 text-[11.5px] font-semibold text-accent-strong">
                  {MODE_META[currentTask.mode].label} · {STAGES[currentTask.mode].length} 阶段
                  {stale && <span className="font-normal text-muted">· 原文已修改</span>}
                </span>
              )}
              <span className="ml-auto flex items-center">
                <CopyButton text={copyText} label="复制" />
              </span>
            </div>

            {isTranslating ? (
              <div role="status" aria-live="polite" className="flex-1 p-5">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-tint/60 px-3 py-1 text-[12.5px] font-medium text-accent-strong">
                  <LoaderInline />
                  <span>
                    正在{STAGES[mode].find((s) => s.key === progress.stage)?.label ?? '生成译文'}…
                  </span>
                  <span className="font-mono text-xs">{progress.progress}%</span>
                </div>
                {/* 仿真段落骨架屏：高度匹配真实文本行高，自然分段流光 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="skeleton-line h-4 w-[96%]" />
                    <div className="skeleton-line h-4 w-[88%]" />
                    <div className="skeleton-line h-4 w-[65%]" />
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="skeleton-line h-4 w-[92%]" />
                    <div className="skeleton-line h-4 w-[74%]" />
                  </div>
                </div>
              </div>
            ) : displayResult ? (
              <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
                {outputFormat === OutputFormat.BILINGUAL
                  ? pairs.map((p, i) => (
                      <div key={i} className="mb-4 border-b border-dashed border-border pb-3 last:mb-0 last:border-0 last:pb-0">
                        <p className="m-0 whitespace-pre-wrap mb-1 text-[13px] leading-[1.6] text-muted">{p.source}</p>
                        <p className="m-0 whitespace-pre-wrap text-[15.5px] leading-[1.9] text-ink">{p.target}</p>
                      </div>
                    ))
                  : <p className="m-0 whitespace-pre-wrap text-[15.5px] leading-[1.9] text-ink">{displayResult}</p>}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                <span className="grid size-11 place-items-center rounded-xl border border-border bg-paper text-accent">
                  <Columns3 className="size-5" />
                </span>
                <span className="text-[14.5px] font-semibold text-ink">译文会显示在这里</span>
                <span className="max-w-[34ch] text-[13px] leading-relaxed text-muted">
                  {sourceText.trim()
                    ? `将按「${MODE_META[mode].label}」输出，预计 ${MODE_META[mode].time}`
                    : '先在左侧输入文本，或按快捷键直接开始'}
                </span>
              </div>
            )}
          </div>
        </div>

        {mode !== TranslationMode.QUICK && (
          <ProgressStrip
            steps={STAGES[mode]}
            stage={progress.stage}
            percent={progress.progress}
            active={isTranslating}
            onViewProcess={canShowProcess ? () => setShowProcessModal(true) : undefined}
          />
        )}
      </Card>

      {/* ---------------- 动作栏 ---------------- */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button size="lg" onClick={handleTranslate} disabled={isTranslating || !sourceText.trim()}>
          {isTranslating ? (
            <>
              <LoaderInline />
              翻译中
            </>
          ) : (
            '开始翻译'
          )}
        </Button>

        {displayResult && (
          <Button variant="outline" size="lg" onClick={() => setShowParagraphComparison(true)}>
            <Columns3 className="size-4" />
            段落对照
          </Button>
        )}
        {canShowReport && (
          <Button variant="outline" size="lg" onClick={() => setShowReport(true)}>
            <FileText className="size-4" />
            翻译报告
          </Button>
        )}

        <span className="ml-auto flex items-center gap-1.5">
          <Button variant="danger" size="sm" onClick={() => setConfirmReset('mode')}>
            清空本模式结果
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmReset('all')}>
            清空所有模式
          </Button>
        </span>
      </div>

      {/* ---------------- 浮层 ---------------- */}
      <ProfessionalTranslationModal
        isOpen={showProcessModal && runningMode === TranslationMode.PROFESSIONAL}
        onClose={() => setShowProcessModal(false)}
        onComplete={() => setShowProcessModal(false)}
        progress={runProgress}
      />
      <DomainAdaptiveTranslationModal
        isOpen={showProcessModal && runningMode === TranslationMode.DOMAIN_ADAPTIVE}
        onClose={() => setShowProcessModal(false)}
        onComplete={() => setShowProcessModal(false)}
        progress={runProgress}
      />

      {currentTask?.result && (
        <TranslationReport
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          sourceText={currentTask.sourceText}
          result={currentTask.result}
          sourceLang={sourceLangName}
          targetLang={targetLangName}
          mode={currentTask.mode === TranslationMode.DOMAIN_ADAPTIVE ? 'domain_adaptive' : 'professional'}
        />
      )}

      {displayResult && (
        <ParagraphComparisonModal
          isOpen={showParagraphComparison}
          onClose={() => setShowParagraphComparison(false)}
          sourceText={currentTask?.sourceText || sourceText}
          translatedText={displayResult}
          sourceLang={sourceLangName}
          targetLang={targetLangName}
        />
      )}

      {/* 破坏性动作：二次确认，不与主操作争权重 */}
      <Dialog
        open={confirmReset !== null}
        onOpenChange={(open) => !open && setConfirmReset(null)}
        size="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>
            {confirmReset === 'all' ? '清空所有模式的结果？' : '清空当前模式的结果？'}
          </DialogTitle>
          <DialogDescription>
            {confirmReset === 'all'
              ? '三种模式的结果与进度都会被清除，且无法恢复。原文输入也会一并清空。'
              : `仅清除「${MODE_META[mode].label}」的结果，其他模式的结果保持不变。`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setConfirmReset(null)}>
            取消
          </Button>
          <Button
            className="bg-danger text-white hover:bg-danger/90"
            onClick={() => confirmReset && doReset(confirmReset)}
          >
            确认清空
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function LoaderInline({ className = "size-3.5" }: { className?: string }) {
  return <Loader2 className={cn("animate-spin text-accent-strong", className)} />;
}

export default Translation;
