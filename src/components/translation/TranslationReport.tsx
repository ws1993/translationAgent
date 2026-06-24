import { X, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { TranslationResult } from '../../types';
import ReactMarkdown from 'react-markdown';

interface TranslationReportProps {
  isOpen: boolean;
  onClose: () => void;
  sourceText: string;
  result: TranslationResult;
  sourceLang: string;
  targetLang: string;
}

export function TranslationReport({
  isOpen,
  onClose,
  sourceText,
  result,
  sourceLang,
  targetLang,
}: TranslationReportProps) {
  if (!isOpen) return null;

  const hasDirectTranslation = !!result.directTranslation;
  const issueCount = result.issues?.length || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-paper rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Warm Charcoal Block */}
        <div className="bg-[#2A2723] text-white px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-medium mb-3">
                <FileText className="w-3 h-3" />
                专业翻译报告
              </div>
              <h1 className="text-3xl font-serif font-bold tracking-tight">
                Translation <span className="text-accent italic">Analysis Report</span>
              </h1>
              <p className="text-sm text-white/70 mt-2">
                {sourceLang} → {targetLang} · 三阶段专业分析
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-light rounded-lg p-4 border border-warm-border">
              <div className="flex items-center gap-2 text-muted text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                翻译阶段
              </div>
              <div className="text-2xl font-serif font-semibold text-ink">3 阶段</div>
              <div className="text-xs text-muted mt-1">直译 · 反思 · 意译</div>
            </div>
            
            <div className="bg-surface-light rounded-lg p-4 border border-warm-border">
              <div className="flex items-center gap-2 text-muted text-sm mb-1">
                <AlertCircle className="w-4 h-4" />
                发现问题
              </div>
              <div className="text-2xl font-serif font-semibold text-accent">{issueCount} 项</div>
              <div className="text-xs text-muted mt-1">已全部优化处理</div>
            </div>
            
            <div className="bg-surface-light rounded-lg p-4 border border-warm-border">
              <div className="flex items-center gap-2 text-muted text-sm mb-1">
                <FileText className="w-4 h-4" />
                字符统计
              </div>
              <div className="text-2xl font-serif font-semibold text-ink">
                {sourceText.length}
              </div>
              <div className="text-xs text-muted mt-1">原文字符数</div>
            </div>
          </div>

          {/* Section 1: Original Text */}
          <section>
            <h2 className="text-xl font-serif font-semibold text-ink mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              原文内容
            </h2>
            <div className="bg-white rounded-lg border border-warm-border p-5 leading-relaxed">
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink">{sourceText}</pre>
            </div>
          </section>

          {/* Section 2: Direct Translation */}
          {hasDirectTranslation && (
            <section>
              <h2 className="text-xl font-serif font-semibold text-ink mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                直译结果
                <span className="text-xs text-muted font-normal ml-2">· 第一阶段：字面翻译</span>
              </h2>
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-5 leading-relaxed">
                <pre className="whitespace-pre-wrap font-sans text-sm text-ink">
                  {result.directTranslation}
                </pre>
              </div>
            </section>
          )}

          {/* Section 3: Issues Analysis */}
          {issueCount > 0 && (
            <section>
              <h2 className="text-xl font-serif font-semibold text-ink mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                问题分析
                <span className="text-xs text-muted font-normal ml-2">
                  · 第二阶段：发现 {issueCount} 处需要优化
                </span>
              </h2>
              <div className="space-y-3">
                {result.issues?.map((issue, idx) => (
                  <div
                    key={idx}
                    className="bg-accent-tint rounded-lg border border-accent/30 p-4 flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-ink leading-relaxed">
                        {(() => {
                          // 移除开头的序号（如 "1. " "2. " 等）
                          let cleanedIssue = issue.replace(/^\d+\.\s*/, '');
                          
                          // 检查是否包含冒号分隔的标题和内容
                          const colonIndex = cleanedIssue.indexOf('：');
                          if (colonIndex > 0 && colonIndex < 100) {
                            const title = cleanedIssue.substring(0, colonIndex + 1);
                            const content = cleanedIssue.substring(colonIndex + 1);
                            return (
                              <>
                                <div className="font-bold text-accent text-base mb-1">
                                  <ReactMarkdown
                                    components={{
                                      p: ({ children }) => <span>{children}</span>,
                                      strong: ({ children }) => <strong>{children}</strong>,
                                    }}
                                  >
                                    {title}
                                  </ReactMarkdown>
                                </div>
                                <div className="text-ink">
                                  <ReactMarkdown
                                    components={{
                                      p: ({ children }) => <span>{children}</span>,
                                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                      em: ({ children }) => <em className="italic">{children}</em>,
                                      code: ({ children }) => (
                                        <code className="bg-white/60 px-1.5 py-0.5 rounded text-xs font-mono border border-warm-border">
                                          {children}
                                        </code>
                                      ),
                                    }}
                                  >
                                    {content}
                                  </ReactMarkdown>
                                </div>
                              </>
                            );
                          }
                          // 没有冒号，渲染整个内容
                          return (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="m-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-bold text-accent">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                code: ({ children }) => (
                                  <code className="bg-white/60 px-1.5 py-0.5 rounded text-xs font-mono border border-warm-border">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {cleanedIssue}
                            </ReactMarkdown>
                          );
                        })()}
                      </div>
                    </div>
                    <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Final Translation */}
          <section>
            <h2 className="text-xl font-serif font-semibold text-ink mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-600/10 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                ✓
              </span>
              最终译文
              <span className="text-xs text-muted font-normal ml-2">· 第三阶段：优化完成</span>
            </h2>
            <div className="bg-green-50 rounded-lg border-2 border-green-300 p-5 leading-relaxed shadow-md">
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink font-medium">
                {result.finalTranslation}
              </pre>
            </div>
          </section>

          {/* Section 5: Comparison */}
          {hasDirectTranslation && (
            <section>
              <h2 className="text-xl font-serif font-semibold text-ink mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold">
                  <ArrowRight className="w-4 h-4" />
                </span>
                译文对比
              </h2>
              <div className="bg-surface-light rounded-lg border border-warm-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-warm-border/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-ink">阶段</th>
                      <th className="text-left px-4 py-3 font-semibold text-ink">内容</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-border">
                    <tr className="hover:bg-accent-tint/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-muted whitespace-nowrap">直译</td>
                      <td className="px-4 py-3 text-ink leading-relaxed">
                        {result.directTranslation}
                      </td>
                    </tr>
                    <tr className="hover:bg-accent-tint/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-green-700 whitespace-nowrap">
                        最终译文
                      </td>
                      <td className="px-4 py-3 text-ink leading-relaxed font-medium">
                        {result.finalTranslation}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="bg-surface-light px-8 py-4 border-t border-warm-border flex justify-between items-center">
          <p className="text-xs text-muted">
            生成时间：{new Date().toLocaleString('zh-CN')}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            关闭报告
          </button>
        </div>
      </div>
    </div>
  );
}
