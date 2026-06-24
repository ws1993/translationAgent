import { useState, useEffect } from 'react';
import { TranslationMode, OutputFormat, Language } from '../types';
import { useTranslationStore } from '../stores/translationStore';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { useDomainStore } from '../stores/domainStore';
import { TranslationService } from '../services/translation/TranslationService';
import { detectLanguage } from '../utils/languageDetector';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { toast } from 'sonner';
import { ProfessionalTranslationModal } from '../components/translation/ProfessionalTranslationModal';
import { TranslationReport } from '../components/translation/TranslationReport';
import { ParagraphComparisonModal } from '../components/translation/ParagraphComparisonModal';
import { FileText, Columns } from 'lucide-react';

function Translation() {
  const [sourceText, setSourceText] = useState('');
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.QUICK);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(OutputFormat.BILINGUAL);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showParagraphComparison, setShowParagraphComparison] = useState(false);
  
  const { currentTask, isTranslating, createTask, updateTaskResult, setIsTranslating, progress, updateProgress } = useTranslationStore();
  const { getActiveConfig } = useLLMConfigStore();
  const { categories, getCategoryById } = useDomainStore();

  useEffect(() => {
    if (isTranslating) {
      setIsTranslating(false);
      updateProgress({ stage: 'idle', progress: 0 });
      toast.warning('检测到未完成的翻译任务，已重置状态');
    }
  }, []);

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

    // 如果是专业模式，打开弹窗
    if (mode === TranslationMode.PROFESSIONAL) {
      setShowProfessionalModal(true);
    }

    setIsTranslating(true);
    updateProgress({ stage: 'idle', progress: 0 });
    
    const newTask = createTask(sourceText, mode, outputFormat, selectedDomainId || undefined);

    try {
      const domainPrompt = selectedDomainId 
        ? getCategoryById(selectedDomainId)?.prompt 
        : undefined;
      
      const translationService = new TranslationService(activeConfig, domainPrompt);
      
      const onProgress = (stage: 'direct' | 'issues' | 'final', stageProgress: number, result?: any) => {
        const currentProgress = useTranslationStore.getState().progress;
        
        let overallProgress = 0;
        if (stage === 'direct') {
          overallProgress = Math.round(stageProgress / 3);
        } else if (stage === 'issues') {
          overallProgress = 33 + Math.round(stageProgress / 3);
        } else if (stage === 'final') {
          overallProgress = 66 + Math.round(stageProgress / 3);
        }
        
        updateProgress({
          stage,
          progress: overallProgress,
          directTranslation: stage === 'direct' && result ? result : currentProgress.directTranslation,
          issues: stage === 'issues' && result ? result : currentProgress.issues,
          finalTranslation: stage === 'final' && result ? result : currentProgress.finalTranslation,
        });
      };
      
      const result = await translationService.translate(sourceText, mode, undefined, onProgress);
      
      updateTaskResult(newTask.id, result);
      toast.success('翻译完成');
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(`翻译失败: ${error.message}`);
      setShowProfessionalModal(false);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleModalComplete = () => {
    setShowReport(false);
  };

  const handleViewReport = () => {
    setShowReport(true);
  };

  const detectedLang = sourceText ? detectLanguage(sourceText) : null;
  const targetLang = detectedLang === 'zh-CN' ? '英文' : '中文';

  const displayResult = currentTask?.result?.finalTranslation || '';
  const canShowReport = mode === TranslationMode.PROFESSIONAL && currentTask?.result && !isTranslating;
  const hasTranslation = displayResult && sourceText.trim();

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
              disabled={isTranslating}
            >
              <ToggleGroupItem value={TranslationMode.QUICK}>
                快速模式
              </ToggleGroupItem>
              <ToggleGroupItem value={TranslationMode.PROFESSIONAL}>
                专业模式
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden shadow-lg mb-6">
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
            <div className="flex-1 min-h-[400px] px-6 py-4 text-[0.95rem] leading-relaxed text-muted overflow-y-auto whitespace-pre-wrap">
              {displayResult || '翻译结果将显示在这里...'}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            size="lg"
            className="px-8"
          >
            {isTranslating ? '翻译中...' : '开始翻译'}
          </Button>

          {hasTranslation && (
            <Button
              onClick={() => setShowParagraphComparison(true)}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Columns className="w-4 h-4" />
              段落对照
            </Button>
          )}

          {canShowReport && (
            <Button
              onClick={handleViewReport}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              查看翻译报告
            </Button>
          )}
        </div>

        <Button
          onClick={() => {
            setSourceText('');
            updateProgress({ stage: 'idle', progress: 0 });
          }}
          variant="ghost"
          disabled={isTranslating}
        >
          清空
        </Button>
      </div>

      {/* 专业模式弹窗 */}
      <ProfessionalTranslationModal
        isOpen={showProfessionalModal}
        onClose={() => setShowProfessionalModal(false)}
        onComplete={handleModalComplete}
        progress={progress}
      />

      {/* 翻译报告 */}
      {currentTask?.result && (
        <TranslationReport
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          sourceText={sourceText}
          result={currentTask.result}
          sourceLang={detectedLang === 'zh-CN' ? '中文' : '英文'}
          targetLang={targetLang}
        />
      )}

      {/* 段落对照弹窗 */}
      {hasTranslation && (
        <ParagraphComparisonModal
          isOpen={showParagraphComparison}
          onClose={() => setShowParagraphComparison(false)}
          sourceText={sourceText}
          translatedText={displayResult}
          sourceLang={detectedLang === 'zh-CN' ? '中文' : '英文'}
          targetLang={targetLang}
        />
      )}
    </div>
  );
}

export default Translation;
