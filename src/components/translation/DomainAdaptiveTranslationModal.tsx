import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { TranslationProgress } from '../../stores/translationStore';
import ReactMarkdown from 'react-markdown';

interface DomainAdaptiveTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  progress: TranslationProgress;
}

export function DomainAdaptiveTranslationModal({
  isOpen,
  onClose,
  onComplete,
  progress,
}: DomainAdaptiveTranslationModalProps) {
  const [activeTab, setActiveTab] = useState<'domain' | 'terminology' | 'direct' | 'issues' | 'final'>('domain');
  const modalRef = useRef<HTMLDivElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progress.stage !== 'idle') {
      setActiveTab(progress.stage);
    }
  }, [progress.stage]);

  useEffect(() => {
    contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress.directTranslation, progress.finalTranslation]);

  if (!isOpen) return null;

  const tabs = [
    { key: 'domain' as const, label: '领域识别', description: '智能分析' },
    { key: 'terminology' as const, label: '术语生成', description: '动态构建' },
    { key: 'direct' as const, label: '初步翻译', description: '领域增强' },
    { key: 'issues' as const, label: '问题分析', description: '专业视角' },
    { key: 'final' as const, label: '精准优化', description: '最终译文' },
  ];

  const getStageStatus = (tabKey: typeof activeTab) => {
    if (tabKey === 'domain' && progress.domainInfo && progress.stage !== 'domain') return 'completed';
    if (tabKey === 'terminology' && progress.terminology && progress.terminology.length > 0 && progress.stage !== 'terminology') return 'completed';
    if (tabKey === 'direct' && progress.directTranslation && progress.stage !== 'direct') return 'completed';
    if (tabKey === 'issues' && progress.issues && progress.issues.length > 0 && progress.stage !== 'issues') return 'completed';
    if (tabKey === 'final' && progress.finalTranslation && progress.stage !== 'final') return 'completed';
    if (progress.stage === tabKey) return 'active';
    return 'pending';
  };

  const getThinkingText = (stage: string) => {
    switch (stage) {
      case 'domain':
        return '正在分析文本所属专业领域';
      case 'terminology':
        return '正在生成领域专业术语表';
      case 'direct':
        return '正在基于领域知识直译';
      case 'issues':
        return '正在从专业角度识别问题';
      case 'final':
        return '正在优化生成最终译文';
      default:
        return '准备中';
    }
  };

  const canSwitchTab = (tabKey: typeof activeTab) => {
    if (tabKey === 'domain') return progress.domainInfo !== undefined;
    if (tabKey === 'terminology') return progress.terminology !== undefined && progress.terminology.length > 0;
    if (tabKey === 'direct') return progress.directTranslation !== undefined;
    if (tabKey === 'issues') return progress.issues !== undefined && progress.issues.length > 0;
    if (tabKey === 'final') return progress.finalTranslation !== undefined;
    return false;
  };

  const renderThinkingHeader = (stage: typeof activeTab) => {
    const status = getStageStatus(stage);
    const isCurrentlyActive = progress.stage === stage;
    
    if (status !== 'active' || !isCurrentlyActive) return null;

    return (
      <div className="mb-4 p-3 bg-[#F0E3D0] rounded-lg border border-[#C8853F]/30 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-[#C8853F] animate-spin flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[#C8853F]">{getThinkingText(stage)}</p>
          <p className="text-xs text-[#8A8A80] mt-0.5">
            {(stage === 'direct' || stage === 'final') ? '内容将实时流式显示' : '分析完成后显示结果'}
          </p>
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
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#F6F1E8] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2D9C8] bg-[#FBF7EF] flex-shrink-0">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1F2421] tracking-tight">
              领域自适应翻译 · <span className="text-[#C8853F] italic">五阶段智能增强</span>
            </h2>
            <p className="text-xs text-[#8A8A80] mt-1">智能领域识别 · 动态术语生成 · 专业精准翻译</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#E2D9C8] transition-all"
          >
            <X className="w-5 h-5 text-[#8A8A80]" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="px-6 py-4 bg-[#FBF7EF] border-b border-[#E2D9C8] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[#1F2421]">翻译进度</p>
            <p className="text-sm font-bold text-[#C8853F]">{progress.progress}%</p>
          </div>
          <div className="relative h-2 bg-[#E2D9C8] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#C8853F] to-[#A86B2C] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          
          {/* Stage Indicators */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-thin pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab, index) => {
                const status = getStageStatus(tab.key);
                return (
                  <div key={tab.key} className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-max">
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : status === 'active' ? (
                        <Loader2 className="w-4 h-4 text-[#C8853F] animate-spin flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#8A8A80] flex-shrink-0" />
                      )}
                      <div className="flex-shrink-0">
                        <p className={`text-xs font-semibold whitespace-nowrap ${
                          status === 'completed' ? 'text-green-600' :
                          status === 'active' ? 'text-[#C8853F]' :
                          'text-[#8A8A80]'
                        }`}>
                          {tab.label}
                        </p>
                        <p className="text-xs text-[#8A8A80] whitespace-nowrap">{tab.description}</p>
                      </div>
                    </div>
                    {index < tabs.length - 1 && (
                      <div className="w-6 h-0.5 bg-[#E2D9C8] flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 bg-[#F6F1E8] overflow-x-auto scrollbar-thin scrollbar-thumb-[#C8853F]/30 scrollbar-track-[#E2D9C8] flex-shrink-0">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const status = getStageStatus(tab.key);
              const isDisabled = !canSwitchTab(tab.key) && status !== 'active';
              
              return (
                <button
                  key={tab.key}
                  onClick={() => !isDisabled && setActiveTab(tab.key)}
                  disabled={isDisabled}
                  className={`
                    px-4 py-3 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap flex-shrink-0
                    ${activeTab === tab.key
                      ? 'bg-white text-[#1F2421] shadow-sm'
                      : isDisabled
                      ? 'text-[#8A8A80] opacity-50 cursor-not-allowed'
                      : 'text-[#8A8A80] hover:text-[#1F2421] hover:bg-[#FBF7EF]'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {status === 'active' && (
                      <Loader2 className="w-4 h-4 text-[#C8853F] animate-spin" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
          {activeTab === 'domain' && (
            <div className="space-y-4">
              {renderThinkingHeader('domain')}
              
              {progress.domainInfo ? (
                <div className="space-y-4">
                  <div className="p-5 bg-[#F0E3D0] rounded-lg border border-[#C8853F]/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#8A8A80] mb-1">主要领域</p>
                        <p className="text-lg font-bold text-[#C8853F]">{progress.domainInfo.primaryDomain}</p>
                      </div>
                      {progress.domainInfo.subDomain && (
                        <div>
                          <p className="text-xs text-[#8A8A80] mb-1">细分领域</p>
                          <p className="text-lg font-bold text-[#A86B2C]">{progress.domainInfo.subDomain}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-[#8A8A80] mb-1">置信度</p>
                        <p className="text-lg font-bold text-green-600">
                          {Math.round(progress.domainInfo.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 bg-[#FBF7EF] rounded-lg border border-[#E2D9C8]">
                    <p className="text-xs text-[#8A8A80] mb-2 font-semibold">判断理由</p>
                    <p className="text-sm text-[#1F2421] leading-relaxed">{progress.domainInfo.reasoning}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-[#8A8A80]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#C8853F] animate-spin" />
                    <p className="text-sm font-medium">等待领域识别...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'terminology' && (
            <div className="space-y-4">
              {renderThinkingHeader('terminology')}
              
              {progress.terminology && progress.terminology.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-4 bg-[#F0E3D0] rounded-lg border border-[#C8853F]/30">
                    <p className="text-sm font-bold text-[#C8853F]">
                      共生成 {progress.terminology.length} 个专业术语
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {progress.terminology.map((term, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#FBF7EF] rounded-lg border border-[#E2D9C8] hover:border-[#C8853F]/40 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[#C8853F] text-white text-sm font-bold rounded-full">
                            {idx + 1}
                          </span>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-[#1F2421]">{term.source}</span>
                              <span className="text-[#8A8A80]">→</span>
                              <span className="font-bold text-[#C8853F]">{term.target}</span>
                            </div>
                            {term.context && (
                              <p className="text-xs text-[#8A8A80]">
                                <span className="font-semibold">使用场景：</span>{term.context}
                              </p>
                            )}
                            {term.notes && (
                              <p className="text-xs text-[#C8853F] bg-[#F0E3D0]/50 px-2 py-1 rounded">
                                <span className="font-semibold">注意：</span>{term.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-[#8A8A80]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#C8853F] animate-spin" />
                    <p className="text-sm font-medium">等待术语生成...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'direct' && (
            <div className="space-y-4">
              {renderThinkingHeader('direct')}
              
              {progress.directTranslation ? (
                <div className="p-5 bg-[#FBF7EF] rounded-lg border border-[#E2D9C8] leading-relaxed">
                  <div className="prose prose-sm max-w-none text-[#1F2421] whitespace-pre-wrap font-normal">
                    {progress.directTranslation}
                  </div>
                  <div ref={contentEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-[#8A8A80]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#C8853F] animate-spin" />
                    <p className="text-sm font-medium">等待初步翻译...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-4">
              {renderThinkingHeader('issues')}
              
              {progress.issues && progress.issues.length > 0 ? (
                <div className="p-5 bg-[#F0E3D0] rounded-lg border border-[#C8853F]/20">
                  <div className="prose prose-sm max-w-none [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:ml-5 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-5">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm text-[#1F2421] leading-relaxed mb-3 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-[#C8853F]">{children}</strong>,
                        em: ({ children }) => <em className="italic text-[#1F2421]">{children}</em>,
                        code: ({ children }) => <code className="bg-white/60 px-1.5 py-0.5 rounded text-xs font-mono text-[#1F2421] border border-[#C8853F]/20">{children}</code>,
                        ul: ({ children }) => <ul className="space-y-2 mb-3 text-sm text-[#1F2421]">{children}</ul>,
                        ol: ({ children }) => <ol className="space-y-2 mb-3 text-sm text-[#1F2421]">{children}</ol>,
                        li: ({ children }) => <li className="text-sm text-[#1F2421] leading-relaxed [&>p]:inline [&>p]:m-0">{children}</li>,
                        h1: ({ children }) => <h1 className="text-lg font-bold text-[#C8853F] mb-2 mt-4 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold text-[#C8853F] mb-2 mt-3 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold text-[#C8853F] mb-1 mt-2 first:mt-0">{children}</h3>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-[#C8853F]/30 pl-3 italic text-sm text-[#8A8A80] my-2">{children}</blockquote>,
                      }}
                    >
                      {progress.issues.join('\n\n')}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-[#8A8A80]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#C8853F] animate-spin" />
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
                <div className="p-5 bg-[#FBF7EF] rounded-lg border border-[#E2D9C8] leading-relaxed">
                  <div className="prose prose-sm max-w-none text-[#1F2421] whitespace-pre-wrap font-normal">
                    {progress.finalTranslation}
                  </div>
                  <div ref={contentEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-[#8A8A80]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#C8853F] animate-spin" />
                    <p className="text-sm font-medium">等待精准优化...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
