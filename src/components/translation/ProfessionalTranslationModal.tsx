import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { TranslationProgress } from '../../stores/translationStore';

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

  // 自动切换到当前正在进行的阶段
  useEffect(() => {
    if (progress.stage !== 'idle' && progress.stage !== activeTab) {
      setActiveTab(progress.stage);
    }
  }, [progress.stage]);

  // 完成时触发回调
  useEffect(() => {
    if (progress.progress >= 100 && progress.finalTranslation) {
      onComplete();
    }
  }, [progress.progress, progress.finalTranslation, onComplete]);

  if (!isOpen) return null;

  const tabs = [
    { key: 'direct' as const, label: '直译', stage: progress.stage === 'direct' },
    { key: 'issues' as const, label: '反思', stage: progress.stage === 'issues' },
    { key: 'final' as const, label: '最终译文', stage: progress.stage === 'final' },
  ];

  const getStageIcon = (tabKey: typeof activeTab) => {
    if (tabKey === 'direct' && progress.directTranslation) return '✓';
    if (tabKey === 'issues' && progress.issues && progress.issues.length > 0) return '✓';
    if (tabKey === 'final' && progress.finalTranslation) return '✓';
    if (progress.stage === tabKey) return '⋯';
    return '';
  };

  const getStageColor = (tabKey: typeof activeTab) => {
    if (tabKey === 'direct' && progress.directTranslation) return 'text-green-600';
    if (tabKey === 'issues' && progress.issues && progress.issues.length > 0) return 'text-green-600';
    if (tabKey === 'final' && progress.finalTranslation) return 'text-green-600';
    if (progress.stage === tabKey) return 'text-amber-600 animate-pulse';
    return 'text-muted-foreground';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[85vh] bg-surface-light rounded-lg shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-border">
          <h2 className="text-xl font-serif font-semibold text-ink">
            专业翻译 · <span className="text-accent italic">三阶段分析</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-warm-border transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="relative h-2 bg-warm-border rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-hover transition-all duration-500 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <p className="text-xs text-muted text-right mt-1">{progress.progress}%</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-warm-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 text-sm font-medium rounded-t-md transition-all
                ${activeTab === tab.key
                  ? 'bg-surface-light border border-warm-border border-b-transparent -mb-[1px] text-ink'
                  : 'text-muted hover:text-ink hover:bg-accent-tint'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                <span className={`text-xs ${getStageColor(tab.key)}`}>
                  {getStageIcon(tab.key)}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'direct' && (
            <div className="prose prose-sm max-w-none">
              {progress.directTranslation ? (
                <div className="p-4 bg-white rounded-lg border border-warm-border leading-relaxed whitespace-pre-wrap">
                  {progress.directTranslation}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-muted">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">正在进行直译...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-3">
              {progress.issues && progress.issues.length > 0 ? (
                progress.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-accent-tint rounded-lg border border-warm-border"
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-accent text-white text-xs font-semibold rounded-full mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-ink leading-relaxed flex-1">{issue}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-12 text-muted">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">正在分析问题...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'final' && (
            <div className="prose prose-sm max-w-none">
              {progress.finalTranslation ? (
                <div className="p-4 bg-white rounded-lg border border-green-200 leading-relaxed whitespace-pre-wrap">
                  {progress.finalTranslation}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-muted">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">正在优化译文...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-warm-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
