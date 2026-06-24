import { X, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TranslationResult } from '../../types';

interface TranslationReportProps {
  isOpen: boolean;
  onClose: () => void;
  sourceText: string;
  result: TranslationResult;
  sourceLang: string;
  targetLang: string;
  mode?: 'professional' | 'domain_adaptive';
  onSwitchToDomainAdaptive?: () => void;
}

export function TranslationReport({
  isOpen,
  onClose,
  sourceText,
  result,
  sourceLang,
  targetLang,
  mode = 'professional',
  onSwitchToDomainAdaptive,
}: TranslationReportProps) {
  if (!isOpen) return null;

  const hasDirectTranslation = !!result.directTranslation;
  const issueCount = result.issues?.length || 0;
  const hasDomainInfo = !!result.domainInfo;
  const terminologyCount = result.terminology?.length || 0;

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
                {mode === 'domain_adaptive' ? '领域自适应翻译报告' : '专业翻译报告'}
              </div>
              <h1 className="text-3xl font-serif font-bold tracking-tight">
                Translation <span className="text-accent italic">Analysis Report</span>
              </h1>
              <p className="text-sm text-white/70 mt-2">
                {sourceLang} → {targetLang} · {mode === 'domain_adaptive' ? '五阶段智能增强' : '三阶段专业分析'}
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
              <div className="text-2xl font-serif font-semibold text-ink">
                {mode === 'domain_adaptive' ? '5 阶段' : '3 阶段'}
              </div>
              <div className="text-xs text-muted mt-1">
                {mode === 'domain_adaptive' ? '领域识别 · 术语生成 · 翻译优化' : '直译 · 问题分析 · 意译'}
              </div>
            </div>
            
            {mode === 'domain_adaptive' && hasDomainInfo ? (
              <div className="bg-surface-light rounded-lg p-4 border border-warm-border">
                <div className="flex items-center gap-2 text-muted text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  识别领域
                </div>
                <div className="text-2xl font-serif font-semibold text-accent">
                  {result.domainInfo?.primaryDomain}
                </div>
                <div className="text-xs text-muted mt-1">
                  {result.domainInfo?.subDomain || '通用领域'}
                </div>
              </div>
            ) : (
              <div className="bg-surface-light rounded-lg p-4 border border-warm-border">
                <div className="flex items-center gap-2 text-muted text-sm mb-1">
                  <AlertCircle className="w-4 h-4" />
                  发现问题
                </div>
                <div className="text-2xl font-serif font-semibold text-accent">{issueCount} 项</div>
                <div className="text-xs text-muted mt-1">已全部优化处理</div>
              </div>
            )}
            
            {mode === 'domain_adaptive' && terminologyCount > 0 ? (
              <div className="bg-surface-light rounded-lg p-4 border border-warm-border">
                <div className="flex items-center gap-2 text-muted text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  专业术语
                </div>
                <div className="text-2xl font-serif font-semibold text-ink">
                  {terminologyCount} 个
                </div>
                <div className="text-xs text-muted mt-1">动态生成</div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Switch to Domain Adaptive Button (Professional Mode Only) */}
          {mode === 'professional' && onSwitchToDomainAdaptive && (
            <div className="bg-gradient-to-r from-[#F0E3D0] to-[#FBF7EF] rounded-lg border border-[#C8853F]/30 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-2">
                    对当前结果不满意？试试领域自适应翻译
                  </h3>
                  <p className="text-sm text-[#8A8A80] leading-relaxed">
                    领域自适应模式会先智能识别文本所属专业领域，然后动态生成术语表，
                    基于领域知识进行翻译，能显著提升专业术语的准确性和一致性。
                  </p>
                </div>
                <button
                  onClick={onSwitchToDomainAdaptive}
                  className="flex-shrink-0 px-6 py-3 bg-[#C8853F] hover:bg-[#A86B2C] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <span>切换到领域翻译</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Domain Info (Domain Adaptive Only) */}
          {mode === 'domain_adaptive' && hasDomainInfo && (
            <section>
              <h2 className="text-xl font-serif font-semibold text-ink mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                领域识别结果
              </h2>
              <div className="bg-[#F0E3D0] rounded-lg border border-[#C8853F]/30 p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[#8A8A80] mb-1">主要领域</p>
                    <p className="text-lg font-bold text-[#C8853F]">{result.domainInfo?.primaryDomain}</p>
                  </div>
                  {result.domainInfo?.subDomain && (
                    <div>
                      <p className="text-xs text-[#8A8A80] mb-1">细分领域</p>
                      <p className="text-lg font-bold text-[#A86B2C]">{result.domainInfo?.subDomain}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[#8A8A80] mb-1">置信度</p>
                    <p className="text-lg font-bold text-green-600">
                      {Math.round((result.domainInfo?.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#C8853F]/20">
                  <p className="text-xs text-[#8A8A80] mb-1">判断理由</p>
                  <p className="text-sm text-[#1F2421]">{result.domainInfo?.reasoning}</p>
                </div>
              </div>
            </section>
          )}

          {/* Section 2: Terminology (Domain Adaptive Only) */}
          {mode === 'domain_adaptive' && terminologyCount > 0 && (
            <section>
              <h2 className="text-xl font-serif font-semibold text-ink mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                专业术语表
                <span className="text-xs text-muted font-normal ml-2">· 共 {terminologyCount} 个术语</span>
              </h2>
              <div className="space-y-2">
                {result.terminology?.map((term, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg border border-warm-border p-4 flex items-start gap-4"
                  >
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-accent text-white text-sm font-bold rounded-full">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-[#1F2421]">{term.source}</span>
                        <span className="text-[#8A8A80]">→</span>
                        <span className="font-bold text-[#C8853F]">{term.target}</span>
                      </div>
                      {term.context && (
                        <p className="text-xs text-[#8A8A80]">
                          <span className="font-semibold">场景：</span>{term.context}
                        </p>
                      )}
                      {term.notes && (
                        <p className="text-xs text-[#C8853F] mt-1">
                          <span className="font-semibold">注意：</span>{term.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Original Text */}
          <section>
            <h2 className="text-xl font-serif font-semibold text-ink mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold">
                {mode === 'domain_adaptive' ? (hasDomainInfo && terminologyCount > 0 ? '3' : hasDomainInfo ? '2' : '1') : '1'}
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
              <div className="bg-accent-tint rounded-lg border border-accent/30 p-5">
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
                    {result.issues?.join('\n\n') || ''}
                  </ReactMarkdown>
                </div>
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
