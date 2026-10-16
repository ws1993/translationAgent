import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { TranslationProgress } from '../../stores/translationStore';
import ReactMarkdown from 'react-markdown';

interface ProfessionalTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  progress: TranslationProgress;
}

export function ProfessionalTranslationModal({
  isOpen,
  onClose,
  onComplete,
  progress,
}: ProfessionalTranslationModalProps) {
  const [activeTab, setActiveTab] = useState<'direct' | 'issues' | 'final'>('direct');
  const modalRef = useRef<HTMLDivElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progress.stage !== 'idle') {
      setActiveTab(progress.stage);
    }
  }, [progress.stage]);

  // 移除自动关闭逻辑，让用户手动查看完整结果后关闭

  useEffect(() => {
    contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress.directTranslation, progress.issues, progress.finalTranslation]);

  if (!isOpen) return null;

  const tabs = [
    { key: 'direct' as const, label: '直译', description: '字面翻译' },
    { key: 'issues' as const, label: '问题分析', description: '专业视角' },
    { key: 'final' as const, label: '最终译文', description: '优化结果' },
  ];

  const getStageStatus = (tabKey: typeof activeTab) => {
    if (tabKey === 'direct' && progress.directTranslation && progress.stage !== 'direct') return 'completed';
    if (tabKey === 'issues' && progress.issues && progress.issues.length > 0 && progress.stage !== 'issues') return 'completed';
    if (tabKey === 'final' && progress.finalTranslation && progress.stage !== 'final') return 'completed';
    if (progress.stage === tabKey) return 'active';
    return 'pending';
  };

  const getThinkingText = (stage: string) => {
    switch (stage) {
      case 'direct':
        return '正在进行直译分析';
      case 'issues':
        return '正在识别翻译问题';
      case 'final':
        return '正在优化最终译文';
      default:
        return '准备中';
    }
  };

  const canSwitchTab = (tabKey: typeof activeTab) => {
    if (tabKey === 'direct') return progress.directTranslation !== undefined;
    if (tabKey === 'issues') return progress.issues !== undefined && progress.issues.length > 0;
    if (tabKey === 'final') return progress.finalTranslation !== undefined;
    return false;
  };

  const renderThinkingHeader = (stage: 'direct' | 'issues' | 'final') => {
    const status = getStageStatus(stage);
    const isCurrentlyActive = progress.stage === stage;
    
    if (status !== 'active' || !isCurrentlyActive) return null;

    return (
      <div className="mb-4 p-3 bg-accent-tint rounded-lg border border-accent/30 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-accent">{getThinkingText(stage)}</p>
          <p className="text-xs text-muted mt-0.5">内容将实时流式显示</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl max-h-[90vh] bg-paper rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface-1">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink tracking-tight">
              专业翻译 · <span className="text-accent italic">三阶段深度分析</span>
            </h2>
            <p className="text-xs text-muted mt-1">流式实时输出 · 透明化翻译过程</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-border transition-all"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="px-6 py-4 bg-surface-1 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-ink">翻译进度</p>
            <p className="text-sm font-bold text-accent">{progress.progress}%</p>
          </div>
          <div className="relative h-2 bg-border rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-strong transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          
          {/* Stage Indicators */}
          <div className="flex items-center gap-4 mt-4">
            {tabs.map((tab, index) => {
              const status = getStageStatus(tab.key);
              return (
                <div key={tab.key} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : status === 'active' ? (
                      <Loader2 className="w-5 h-5 text-accent animate-spin flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${
                        status === 'completed' ? 'text-green-600' :
                        status === 'active' ? 'text-accent' :
                        'text-muted'
                      }`}>
                        {tab.label}
                      </p>
                      <p className="text-xs text-muted">{tab.description}</p>
                    </div>
                  </div>
                  {index < tabs.length - 1 && (
                    <div className="w-8 h-0.5 bg-border flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 bg-paper">
          {tabs.map((tab) => {
            const status = getStageStatus(tab.key);
            const isDisabled = !canSwitchTab(tab.key) && status !== 'active';
            
            return (
              <button
                key={tab.key}
                onClick={() => !isDisabled && setActiveTab(tab.key)}
                disabled={isDisabled}
                className={`
                  px-5 py-3 text-sm font-semibold rounded-t-lg transition-all
                  ${activeTab === tab.key
                    ? 'bg-white text-ink shadow-sm'
                    : isDisabled
                    ? 'text-muted opacity-50 cursor-not-allowed'
                    : 'text-muted hover:text-ink hover:bg-surface-1'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  {status === 'active' && (
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
          {activeTab === 'direct' && (
            <div className="space-y-4">
              {renderThinkingHeader('direct')}
              
              {progress.directTranslation ? (
                <div className="p-5 bg-surface-1 rounded-lg border border-border leading-relaxed">
                  <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap font-normal">
                    {progress.directTranslation}
                  </div>
                  <div ref={contentEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-muted">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    <p className="text-sm font-medium">等待直译开始...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-4">
              {renderThinkingHeader('issues')}
              
              {progress.issues && progress.issues.length > 0 ? (
                <div className="p-5 bg-accent-tint rounded-lg border border-accent/20">
                  <div className="prose prose-sm max-w-none [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:ml-5 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-5">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm text-ink leading-relaxed mb-3 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-accent">{children}</strong>,
                        em: ({ children }) => <em className="italic text-ink">{children}</em>,
                        code: ({ children }) => <code className="bg-white/60 px-1.5 py-0.5 rounded text-xs font-mono text-ink border border-accent/20">{children}</code>,
                        ul: ({ children }) => <ul className="space-y-2 mb-3 text-sm text-ink">{children}</ul>,
                        ol: ({ children }) => <ol className="space-y-2 mb-3 text-sm text-ink">{children}</ol>,
                        li: ({ children }) => <li className="text-sm text-ink leading-relaxed [&>p]:inline [&>p]:m-0">{children}</li>,
                        h1: ({ children }) => <h1 className="text-lg font-bold text-accent mb-2 mt-4 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold text-accent mb-2 mt-3 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold text-accent mb-1 mt-2 first:mt-0">{children}</h3>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-accent/30 pl-3 italic text-sm text-muted my-2">{children}</blockquote>,
                      }}
                    >
                      {progress.issues.join('\n\n')}
                    </ReactMarkdown>
                  </div>
                  <div ref={contentEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-muted">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    <p className="text-sm font-medium">等待问题分析...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'final' && (
            <div className="space-y-4">
              {renderThinkingHeader('final')}
              
              {progress.finalTranslation ? (
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 leading-relaxed">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">最终优化译文</p>
                  </div>
                  <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap font-normal">
                    {progress.finalTranslation}
                  </div>
                  <div ref={contentEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-muted">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    <p className="text-sm font-medium">等待最终译文生成...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-1 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-muted hover:text-ink hover:bg-border rounded-lg transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
