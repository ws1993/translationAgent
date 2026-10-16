/**
 * 统一的段落切分口径。
 *
 * 页面统计、分段对照、段落对照浮层必须共用这一份逻辑，否则会出现
 * 「原文视觉上 2 段、顶部统计 1 段、对照浮层 3 段」这类对不齐的问题
 * （原缺陷：toPairs 按空行切、ParagraphComparisonModal 按单换行切）。
 *
 * 规则：
 *  1. 存在空行（连续 2 个及以上换行）时，以空行为段落边界——长文常见写法；
 *  2. 全文只有单次换行时，单次换行即段落边界——文本框里按 Enter 分段的用户预期；
 *  3. 段落内部的换行予以保留，交给 whitespace-pre-wrap 渲染，不做行内折叠。
 */

/** 归一化换行：CRLF / CR → LF */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/** 切分段落；空数组表示无有效内容 */
export function splitParagraphs(text: string): string[] {
  const trimmed = normalizeNewlines(text).trim();
  if (!trimmed) return [];

  const byBlankLine = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (byBlankLine.length > 1) return byBlankLine;

  return trimmed
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** 段落数（用于「N 段」这类统计展示） */
export function countParagraphs(text: string): number {
  return splitParagraphs(text).length;
}

/**
 * 段内换行的兜底判定：两侧段落数一致时才能逐段对齐。
 * 译文常被模型按语义重新切段，此时不要强行错位配对，退化为整块展示。
 */
export function alignParagraphs(source: string, translated: string) {
  const S = splitParagraphs(source);
  const T = splitParagraphs(translated);
  if (!S.length || !T.length) return [];
  if (S.length !== T.length) {
    return [{ source: S.join('\n\n'), target: T.join('\n\n') }];
  }
  return S.map((s, i) => ({ source: s, target: T[i] }));
}
