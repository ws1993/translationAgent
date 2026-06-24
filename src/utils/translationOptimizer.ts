/**
 * 翻译优化工具集
 * 包含智能判断、分段处理等性能优化功能
 */

/**
 * 判断文本是否需要使用专业翻译模式
 * 规则：中文<30字 或 英文<50词 且 只有1句 → 使用快速模式
 * 
 * @param text 待翻译文本
 * @returns true 使用专业模式，false 使用快速模式
 */
export function shouldUseProfessionalMode(text: string): boolean {
  if (!text || !text.trim()) {
    return false;
  }

  const trimmedText = text.trim();
  
  const chineseCharCount = (trimmedText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWordCount = trimmedText.split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length;
  const sentenceCount = trimmedText.split(/[。.!?！？]/).filter(s => s.trim()).length;
  
  if (sentenceCount <= 1) {
    if (chineseCharCount > 0 && chineseCharCount < 30) {
      return false;
    }
    if (englishWordCount > 0 && englishWordCount < 50) {
      return false;
    }
  }
  
  return true;
}

/**
 * 智能分段（保持句子完整性）
 * 
 * @param text 待分段文本
 * @param maxLength 最大分段长度（字符数），默认500
 * @returns 分段后的文本数组
 */
export function splitTextIntoChunks(text: string, maxLength: number = 500): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  if (text.length <= maxLength) {
    return [text];
  }

  const sentences = text.split(/([。.!?！？\n])/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || '');
    
    if (!sentence.trim()) {
      continue;
    }
    
    if ((currentChunk + sentence).length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

/**
 * 合并翻译结果（处理分段翻译的拼接）
 * 
 * @param chunks 分段翻译结果数组
 * @returns 合并后的完整文本
 */
export function mergeTranslatedChunks(chunks: string[]): string {
  if (!chunks || chunks.length === 0) {
    return '';
  }
  
  if (chunks.length === 1) {
    return chunks[0];
  }
  
  return chunks.join('');
}

/**
 * 性能监控数据接口
 */
export interface TranslationPerformanceMetrics {
  totalDuration: number;
  chunkCount: number;
  avgChunkDuration: number;
  mode: 'quick' | 'professional';
  textLength: number;
  timestamp: number;
}

/**
 * 创建性能监控对象
 */
export function createPerformanceTracker() {
  const startTime = Date.now();
  let chunkCount = 0;
  
  return {
    incrementChunkCount() {
      chunkCount++;
    },
    
    getMetrics(mode: 'quick' | 'professional', textLength: number): TranslationPerformanceMetrics {
      const totalDuration = Date.now() - startTime;
      return {
        totalDuration,
        chunkCount,
        avgChunkDuration: chunkCount > 0 ? totalDuration / chunkCount : totalDuration,
        mode,
        textLength,
        timestamp: Date.now(),
      };
    }
  };
}
