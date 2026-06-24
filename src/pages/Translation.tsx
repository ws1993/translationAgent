import { useState } from 'react';
import { TranslationMode, OutputFormat } from '../types';
import { useTranslationStore } from '../stores/translationStore';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { useDomainStore } from '../stores/domainStore';
import { TranslationService } from '../services/translation/TranslationService';
import { detectLanguage } from '../utils/languageDetector';

function Translation() {
  const [sourceText, setSourceText] = useState('');
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.QUICK);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(OutputFormat.BILINGUAL);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  
  const { currentTask, isTranslating, createTask, updateTaskResult, setIsTranslating } = useTranslationStore();
  const { getActiveConfig } = useLLMConfigStore();
  const { categories, getCategoryById } = useDomainStore();

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      alert('请输入需要翻译的文本');
      return;
    }

    const activeConfig = getActiveConfig();
    if (!activeConfig) {
      alert('请先在设置页面配置大模型');
      return;
    }

    setIsTranslating(true);
    createTask(sourceText, mode, outputFormat, selectedDomainId || undefined);

    try {
      const domainPrompt = selectedDomainId 
        ? getCategoryById(selectedDomainId)?.prompt 
        : undefined;
      
      const translationService = new TranslationService(activeConfig, domainPrompt);
      const result = await translationService.translate(sourceText, mode);
      
      if (currentTask) {
        updateTaskResult(currentTask.id, result);
      }
    } catch (error: any) {
      alert(`翻译失败: ${error.message}`);
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

      <div className="bg-surface-1 border border-border rounded-xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              翻译模式
            </label>
            <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setMode(TranslationMode.QUICK)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                  mode === TranslationMode.QUICK
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-accent-tint hover:text-accent-hover'
                }`}
              >
                快速模式
              </button>
              <button
                onClick={() => setMode(TranslationMode.PROFESSIONAL)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                  mode === TranslationMode.PROFESSIONAL
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-accent-tint hover:text-accent-hover'
                }`}
              >
                专业模式
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              输出格式
            </label>
            <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOutputFormat(OutputFormat.BILINGUAL)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                  outputFormat === OutputFormat.BILINGUAL
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-accent-tint hover:text-accent-hover'
                }`}
              >
                对照显示
              </button>
              <button
                onClick={() => setOutputFormat(OutputFormat.TRANSLATION_ONLY)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                  outputFormat === OutputFormat.TRANSLATION_ONLY
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-accent-tint hover:text-accent-hover'
                }`}
              >
                纯译文
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              专业领域
            </label>
            <select
              value={selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value)}
              className="px-4 py-2.5 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">通用领域</option>
              {level2Categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-lg mb-6">
        {outputFormat === OutputFormat.BILINGUAL ? (
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="flex flex-col">
              <div className="px-6 py-4 bg-surface-1 border-b border-border">
                <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">原文</h3>
              </div>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="flex-1 min-h-[400px] px-6 py-4 text-base leading-relaxed text-ink resize-none focus:outline-none bg-transparent"
                placeholder="在此输入需要翻译的文本..."
                disabled={isTranslating}
              />
            </div>
            <div className="flex flex-col">
              <div className="px-6 py-4 bg-surface-1 border-b border-border">
                <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">译文</h3>
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
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                输入文本
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="w-full h-32 px-4 py-3 text-base leading-relaxed text-ink border border-border rounded-lg resize-none focus:outline-none focus:border-accent transition-colors"
                placeholder="在此输入需要翻译的文本..."
                disabled={isTranslating}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                翻译结果
              </label>
              <div className="w-full min-h-[400px] px-4 py-3 text-[0.95rem] leading-relaxed text-muted border border-border rounded-lg bg-surface-1">
                {currentTask?.result?.finalTranslation || (
                  <span className="text-muted/60">翻译结果将显示在此...</span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

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
        <button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          className="px-10 py-3 bg-accent text-white rounded-lg text-base font-semibold transition-all shadow-[0_2px_8px_rgba(200,133,63,0.2)] hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(200,133,63,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isTranslating ? '翻译中...' : '开始翻译'}
        </button>
      </div>
    </div>
  );
}

export default Translation;
