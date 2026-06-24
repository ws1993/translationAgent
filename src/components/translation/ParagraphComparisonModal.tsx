import { useState, useEffect, useRef } from 'react';
import { X, Minimize2 } from 'lucide-react';

interface ParagraphComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

interface Paragraph {
  id: number;
  text: string;
}

export function ParagraphComparisonModal({
  isOpen,
  onClose,
  sourceText,
  translatedText,
  sourceLang,
  targetLang,
}: ParagraphComparisonModalProps) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sourceScrollRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);

  // 分段逻辑：按换行符分段
  const sourceParagraphs: Paragraph[] = sourceText
    .split('\n')
    .filter(p => p.trim())
    .map((text, idx) => ({ id: idx, text: text.trim() }));

  const targetParagraphs: Paragraph[] = translatedText
    .split('\n')
    .filter(p => p.trim())
    .map((text, idx) => ({ id: idx, text: text.trim() }));

  // 同步滚动
  const handleScroll = (source: 'source' | 'target') => {
    if (isScrollingSyncRef.current) return;

    const sourceEl = sourceScrollRef.current;
    const targetEl = targetScrollRef.current;
    if (!sourceEl || !targetEl) return;

    isScrollingSyncRef.current = true;

    if (source === 'source') {
      const scrollPercentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
      targetEl.scrollTop = scrollPercentage * (targetEl.scrollHeight - targetEl.clientHeight);
    } else {
      const scrollPercentage = targetEl.scrollTop / (targetEl.scrollHeight - targetEl.clientHeight);
      sourceEl.scrollTop = scrollPercentage * (sourceEl.scrollHeight - sourceEl.clientHeight);
    }

    setTimeout(() => {
      isScrollingSyncRef.current = false;
    }, 50);
  };

  // 点击段落高亮并滚动到对应位置
  const handleParagraphClick = (index: number, source: 'source' | 'target') => {
    setHighlightedIndex(index);

    const sourceEl = sourceScrollRef.current;
    const targetEl = targetScrollRef.current;
    if (!sourceEl || !targetEl) return;

    // 滚动到对应段落
    const targetElement = source === 'source' 
      ? sourceEl.querySelector(`[data-paragraph-id="${index}"]`)
      : targetEl.querySelector(`[data-paragraph-id="${index}"]`);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 同步滚动另一侧
    setTimeout(() => {
      const otherElement = source === 'source'
        ? targetEl.querySelector(`[data-paragraph-id="${index}"]`)
        : sourceEl.querySelector(`[data-paragraph-id="${index}"]`);

      if (otherElement) {
        otherElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (!isOpen) return null;

  const activeIndex = hoveredIndex !== null ? hoveredIndex : highlightedIndex;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[95vw] h-[90vh] bg-paper rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2A2723] text-white px-8 py-5 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-medium mb-2">
              <Minimize2 className="w-3 h-3" />
              段落对照模式
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">
              Interactive <span className="text-accent italic">Paragraph Comparison</span>
            </h1>
            <p className="text-sm text-white/70 mt-1">
              {sourceLang} ⇄ {targetLang} · 点击或悬浮段落查看对应关系
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Source Column */}
          <div className="flex-1 flex flex-col border-r border-warm-border">
            <div className="bg-surface-1 px-6 py-3 border-b border-warm-border">
              <h2 className="text-sm font-semibold text-ink">{sourceLang}</h2>
            </div>
            <div
              ref={sourceScrollRef}
              onScroll={() => handleScroll('source')}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
            >
              {sourceParagraphs.map((para) => (
                <div
                  key={para.id}
                  data-paragraph-id={para.id}
                  onClick={() => handleParagraphClick(para.id, 'source')}
                  onMouseEnter={() => setHoveredIndex(para.id)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all duration-200
                    ${activeIndex === para.id
                      ? 'bg-accent/15 border-2 border-accent shadow-md ring-2 ring-accent/20'
                      : 'bg-white border border-warm-border hover:border-accent/50 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`
                        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${activeIndex === para.id
                          ? 'bg-accent text-white'
                          : 'bg-warm-border text-muted'
                        }
                      `}
                    >
                      {para.id + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-ink flex-1">
                      {para.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Target Column */}
          <div className="flex-1 flex flex-col">
            <div className="bg-surface-1 px-6 py-3 border-b border-warm-border">
              <h2 className="text-sm font-semibold text-ink">{targetLang}</h2>
            </div>
            <div
              ref={targetScrollRef}
              onScroll={() => handleScroll('target')}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
            >
              {targetParagraphs.map((para) => (
                <div
                  key={para.id}
                  data-paragraph-id={para.id}
                  onClick={() => handleParagraphClick(para.id, 'target')}
                  onMouseEnter={() => setHoveredIndex(para.id)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all duration-200
                    ${activeIndex === para.id
                      ? 'bg-accent/15 border-2 border-accent shadow-md ring-2 ring-accent/20'
                      : 'bg-white border border-warm-border hover:border-accent/50 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`
                        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${activeIndex === para.id
                          ? 'bg-accent text-white'
                          : 'bg-warm-border text-muted'
                        }
                      `}
                    >
                      {para.id + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-ink flex-1">
                      {para.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-surface-1 px-8 py-4 border-t border-warm-border flex justify-between items-center">
          <p className="text-xs text-muted">
            共 {Math.max(sourceParagraphs.length, targetParagraphs.length)} 个段落
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            关闭对照
          </button>
        </div>
      </div>
    </div>
  );
}
