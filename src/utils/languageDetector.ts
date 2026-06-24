import { Language } from '../types';

export function detectLanguage(text: string): Language {
  if (!text || text.trim().length === 0) {
    return Language.EN;
  }

  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const totalChars = text.replace(/\s/g, '').length;
  
  if (totalChars === 0) {
    return Language.EN;
  }
  
  const chineseRatio = chineseChars.length / totalChars;
  
  return chineseRatio > 0.3 ? Language.ZH_CN : Language.EN;
}
