import { useState } from 'react';
import { TranslationMode, OutputFormat } from '../types';
import { useTranslationStore, TranslationProgress } from '../stores/translationStore';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { useDomainStore } from '../stores/domainStore';
import { TranslationService } from '../services/translation/TranslationService';
import { detectLanguage } from '../utils/languageDetector';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select-radix';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';

// 进度展示组件
function TranslationProgressDisplay({ progress }: { progress: TranslationProgress }) {
  const stageLabels = {
    direct: '直译',
    issues: '问题分析',
    final: '意译',
    idle: '准备中',
  };

  const stageColors = {
    direct: 'bg-blue-500',
    issues: 'bg-yellow-500',
    final: 'bg-green-500',
    idle: 'bg-gray-300',
  };

  const stageBorderColors = {
    direct: 'border-blue-200',
    issues: 'border-yellow-200',
    final: 'border-green-200',
    idle: 'border-gray-200',
  };

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">翻译进度</span>
            <span className="text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>

        {/* 卡片式进度展示 */}
        <div className="space-y-3">
          {/* 直译卡片 */}
          <div className={`border rounded-lg p-4 transition-all duration-300 ${
            progress.stage === 'direct' ? `${stageBorderColors.direct} bg-blue-50` :
            progress.progress > 33 ? 'border-green-200 bg-green-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  progress.stage === 'direct' ? `${stageColors.direct} animate-pulse` :
                  progress.progress > 33 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="font-medium">{stageLabels.direct}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress.progress > 33 ? '✓ 完成' : 
                 progress.stage === 'direct' ? '进行中...' : '等待中'}
              </span>
            </div>
            {progress.directTranslation && (
              <div className="mt-3 p-3 bg-white rounded border text-sm leading-relaxed">
                {progress.directTranslation}
              </div>
            )}
          </div>

          {/* 问题分析卡片 */}
          <div className={`border rounded-lg p-4 transition-all duration-300 ${
            progress.stage === 'issues' ? `${stageBorderColors.issues} bg-yellow-50` :
            progress.progress > 66 ? 'border-green-200 bg-green-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  progress.stage === 'issues' ? `${stageColors.issues} animate-pulse` :
                  progress.progress > 66 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="font-medium">{stageLabels.issues}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress.progress > 66 ? '✓ 完成' : 
                 progress.stage === 'issues' ? '进行中...' : '等待中'}
              </span>
            </div>
            {progress.issues && progress.issues.length > 0 && (
              <div className="mt-3 space-y-2">
                {progress.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-sm">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span className="text-muted-foreground">{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 意译卡片 */}
          <div className={`border rounded-lg p-4 transition-all duration-300 ${
            progress.stage === 'final' ? `${stageBorderColors.final} bg-green-50` :
            progress.progress >= 100 ? 'border-green-200 bg-green-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  progress.stage === 'final' ? `${stageColors.final} animate-pulse` :
                  progress.progress >= 100 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="font-medium">{stageLabels.final}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress.progress >= 100 ? '✓ 完成' : 
                 progress.stage === 'final' ? '进行中...' : '等待中'}
              </span>
            </div>
            {progress.finalTranslation && (
              <div className="mt-3 p-3 bg-white rounded border text-sm leading-relaxed">
                {progress.finalTranslation}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Translation() {
  const [sourceText, setSourceText] = useState('');
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.QUICK);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(OutputFormat.BILINGUAL);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  
  const { currentTask, isTranslating, createTask, updateTaskResult, setIsTranslating, progress, updateProgress } = useTranslationStore();
  const { getActiveConfig } = useLLMConfigStore();
  const { categories, getCategoryById } = useDomainStore();

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.error('请输入需要翻译的文本');
      return;
    }

    const activeConfig = getActiveConfig();
    if (!activeConfig) {
      toast.error('请先在设置页面配置大模型');
      return;
    }

    setIsTranslating(true);
    updateProgress({ stage: 'idle', progress: 0 });
    createTask(sourceText, mode, outputFormat, selectedDomainId || undefined);

    try {
      const domainPrompt = selectedDomainId 
        ? getCategoryById(selectedDomainId)?.prompt 
        : undefined;
      
      const translationService = new TranslationService(activeConfig, domainPrompt);
      
      // 创建进度回调
      const onProgress = (stage: 'direct' | 'issues' | 'final', progress: number, result?: any) => {
        const newProgress: TranslationProgress = {
          stage,
          progress,
          ...(stage === 'direct' && result ? { directTranslation: result } : {}),
          ...(stage === 'issues' && result ? { issues: result } : {}),
          ...(stage === 'final' && result ? { finalTranslation: result } : {}),
        };
        updateProgress(newProgress);
      };
      
      const result = await translationService.translate(sourceText, mode, undefined, onProgress);
      
      if (currentTask) {
        updateTaskResult(currentTask.id, result);
      }
      toast.success('翻译完成');
    } catch (error: any) {
      toast.error(`翻译失败: ${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const detectedLang = sourceText ? detectLanguage(sourceText) : null;
  const targetLang = detectedLang === 'zh-CN' ? '英文' : '中文';

  const level2Categories = categories.filter(c => c.level === 2);

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-[1.75rem] font-serif font-semibold leading-tight tracking-tight text-ink mb-2">
          <span className="text-accent italic">智能翻译</span> 中英文互译
        </h1>
        <p className="text-[0.9rem] text-muted flex items-center gap-2">
          专业精准
          {detectedLang && (
            <>
              <span>·</span>
              <span className="text-accent-hover font-medium">
                检测到{detectedLang === 'zh-CN' ? '中文' : '英文'}，将翻译为{targetLang}
              </span>
            </>
          )}
        </p>
      </header>

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label>翻译模式</Label>
            <ToggleGroup
              value={mode}
              onValueChange={(value) => setMode(value as TranslationMode)}
            >
              <ToggleGroupItem value={TranslationMode.QUICK}>
                快速模式
              </ToggleGroupItem>
              <ToggleGroupItem value={TranslationMode.PROFESSIONAL}>
                专业模式
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label>输出格式</Label>
            <ToggleGroup
              value={outputFormat}
              onValueChange={(value) => setOutputFormat(value as OutputFormat)}
            >
              <ToggleGroupItem value={OutputFormat.BILINGUAL}>
                对照显示
              </ToggleGroupItem>
              <ToggleGroupItem value={OutputFormat.TRANSLATION_ONLY}>
                纯译文
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* <div className="flex flex-col gap-2">
            <Label>专业领域</Label>
            <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
              <SelectTrigger>
                <SelectValue placeholder="通用领域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">通用领域</SelectItem>
                {level2Categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}
        </div>
      </Card>

      {/* 专业模式进度展示 */}
      {mode === TranslationMode.PROFESSIONAL && isTranslating && (
        <TranslationProgressDisplay progress={progress} />
      )}

      <Card className="overflow-hidden shadow-lg mb-6">
        {outputFormat === OutputFormat.BILINGUAL ? (
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="flex flex-col">
              <div className="px-6 py-4 bg-surface-1 border-b border-border">
                <Label>原文</Label>
              </div>
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="flex-1 min-h-[400px] border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="在此输入需要翻译的文本..."
                disabled={isTranslating}
              />
            </div>
            <div className="flex flex-col">
              <div className="px-6 py-4 bg-surface-1 border-b border-border">
                <Label>译文</Label>
              </div>
              <div className="flex-1 min-h-[400px] px-6 py-4 text-[0.95rem] leading-relaxed text-muted overflow-y-auto">
                {currentTask?.result?.finalTranslation || (
                  <span className="text-muted/60">翻译结果将显示在此...</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <Label className="block mb-2">输入文本</Label>
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="h-32"
                placeholder="在此输入需要翻译的文本..."
                disabled={isTranslating}
              />
            </div>
            <div>
              <Label className="block mb-2">翻译结果</Label>
              <div className="w-full min-h-[400px] px-4 py-3 text-[0.95rem] leading-relaxed text-muted border border-border rounded-lg bg-surface-1">
                {currentTask?.result?.finalTranslation || (
                  <span className="text-muted/60">翻译结果将显示在此...</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {mode === TranslationMode.PROFESSIONAL && currentTask?.result?.directTranslation && (
        <div className="space-y-4">
          <details className="border border-border rounded-lg p-4 bg-surface-1">
            <summary className="font-medium cursor-pointer text-ink">
              查看直译结果
            </summary>
            <div className="mt-3 text-sm text-muted whitespace-pre-wrap leading-relaxed">
              {currentTask.result.directTranslation}
            </div>
          </details>
          {currentTask.result.issues && currentTask.result.issues.length > 0 && (
            <details className="border border-border rounded-lg p-4 bg-surface-1">
              <summary className="font-medium cursor-pointer text-ink">
                查看问题分析
              </summary>
              <ul className="mt-3 text-sm text-muted space-y-1.5">
                {currentTask.result.issues.map((issue, idx) => (
                  <li key={idx}>· {issue}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          size="lg"
        >
          {isTranslating ? '翻译中...' : '开始翻译'}
        </Button>
      </div>
    </div>
  );
}

export default Translation;
