import { LLMService, LLMMessage } from '../llm/LLMService';
import { LLMConfig, Language, TranslationMode, TranslationResult } from '../../types';
import { detectLanguage } from '../../utils/languageDetector';

export type ProgressCallback = (stage: 'direct' | 'issues' | 'final', progress: number, result?: any) => void;

export class TranslationService {
  private llmService: LLMService;
  private domainPrompt?: string;

  constructor(config: LLMConfig, domainPrompt?: string) {
    this.llmService = new LLMService(config);
    this.domainPrompt = domainPrompt;
  }

  async translate(
    sourceText: string,
    mode: TranslationMode,
    sourceLang?: Language,
    onProgress?: ProgressCallback
  ): Promise<TranslationResult> {
    const detectedLang = sourceLang || detectLanguage(sourceText);
    const targetLang = detectedLang === Language.ZH_CN ? Language.EN : Language.ZH_CN;

    if (mode === TranslationMode.QUICK) {
      return await this.quickTranslate(sourceText, detectedLang, targetLang);
    } else {
      return await this.professionalTranslate(sourceText, detectedLang, targetLang, onProgress);
    }
  }

  private async quickTranslate(
    sourceText: string,
    sourceLang: Language,
    targetLang: Language
  ): Promise<TranslationResult> {
    const targetLanguageName = targetLang === Language.ZH_CN ? '简体中文' : 'English';
    
    const systemPrompt = this.buildSystemPrompt(sourceLang, targetLang);
    
    const userPrompt = `请将以下文本翻译成${targetLanguageName}：

${sourceText}`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.llmService.sendMessage(messages);

    return {
      finalTranslation: response.content,
    };
  }

  private async professionalTranslate(
    sourceText: string,
    sourceLang: Language,
    targetLang: Language,
    onProgress?: ProgressCallback
  ): Promise<TranslationResult> {
    const targetLanguageName = targetLang === Language.ZH_CN ? '简体中文' : 'English';
    const sourceLanguageName = sourceLang === Language.ZH_CN ? '中文' : '英文';
    
    const baseSystemPrompt = `你是一位精通${sourceLanguageName}和${targetLanguageName}的专业翻译。请确保输出的文本编码正确，使用UTF-8编码。`;
    
    // 第一步：直译 (流式)
    onProgress?.('direct', 0);
    
    const directTranslationPrompt = `${this.domainPrompt ? this.domainPrompt + '\n\n' : ''}请将以下${sourceLanguageName}文本直译成${targetLanguageName}，保持原有格式，不要遗漏任何信息。

注意：
- 请直接输出翻译结果
- 不要添加任何解释或说明
- 确保使用正确的字符编码

原文：
${sourceText}`;

    const directMessages: LLMMessage[] = [
      { role: 'system', content: baseSystemPrompt },
      { role: 'user', content: directTranslationPrompt },
    ];

    const directResponse = await this.llmService.sendMessageStream(directMessages, (chunk, fullText) => {
      onProgress?.('direct', Math.min(95, Math.floor((fullText.length / (sourceText.length * 2)) * 100)), fullText);
    });
    const directTranslation = directResponse.content.trim();
    
    console.log('[Translation] Direct translation completed:', directTranslation.substring(0, 100));
    onProgress?.('direct', 100, directTranslation);

    // 第二步：问题分析
    onProgress?.('issues', 0);
    
    const issuesPrompt = `根据以下直译结果，指出其中存在的具体问题。要准确描述，不宜笼统表示，包括但不仅限于：
- 不符合${targetLanguageName}表达习惯的地方
- 语句不通顺的位置
- 晦涩难懂、不易理解的内容

直译结果：
${directTranslation}

请以列表形式列出具体问题：`;

    const issuesMessages: LLMMessage[] = [
      { role: 'system', content: baseSystemPrompt },
      { role: 'user', content: issuesPrompt },
    ];

    const issuesResponse = await this.llmService.sendMessage(issuesMessages);
    const issues = issuesResponse.content.split('\n').filter(line => line.trim());
    
    console.log('[Translation] Issues analysis completed:', issues.length, 'issues found');
    onProgress?.('issues', 100, issues);

    // 第三步：意译 (流式)
    onProgress?.('final', 0);
    
    const finalPrompt = `根据直译结果和指出的问题，重新进行意译。在保证内容原意的基础上，使其更易于理解，更符合${targetLanguageName}的表达习惯，同时保持原有的格式不变。

直译结果：
${directTranslation}

存在的问题：
${issues.join('\n')}

注意：
- 请直接输出最终的译文
- 不要添加"意译结果："等前缀
- 不要添加任何解释或说明
- 确保使用正确的字符编码`;

    const finalMessages: LLMMessage[] = [
      { role: 'system', content: baseSystemPrompt },
      { role: 'user', content: finalPrompt },
    ];

    const finalResponse = await this.llmService.sendMessageStream(finalMessages, (chunk, fullText) => {
      onProgress?.('final', Math.min(95, Math.floor((fullText.length / (sourceText.length * 2)) * 100)), fullText);
    });
    const finalTranslation = finalResponse.content.trim();
    
    console.log('[Translation] Final translation completed:', finalTranslation.substring(0, 100));
    onProgress?.('final', 100, finalTranslation);

    return {
      directTranslation,
      issues,
      finalTranslation,
    };
  }

  private buildSystemPrompt(sourceLang: Language, targetLang: Language): string {
    const targetLanguageName = targetLang === Language.ZH_CN ? '简体中文' : 'English';
    const sourceLanguageName = sourceLang === Language.ZH_CN ? '中文' : '英文';

    let prompt = `你是一位精通${sourceLanguageName}和${targetLanguageName}的专业翻译。

翻译规则：
- 准确传达原文的事实和背景
- 保留原始段落格式
- 保留术语（如 FLAC, JPEG 等）和公司缩写（如 Microsoft, Amazon, OpenAI 等）
- 人名不翻译
- 保留引用格式（如 [20]）
- Figure 翻译为"图"，Table 翻译为"表"，保留编号格式
- 全角括号换成半角括号，左括号前加半角空格，右括号后加半角空格
- 如果输入是 Markdown 格式，输出也必须保留原始 Markdown 格式
- 专业术语第一次出现时在括号里写上原文，例如："生成式 AI (Generative AI)"`;

    if (this.domainPrompt) {
      prompt += `\n\n领域约束：\n${this.domainPrompt}`;
    }

    return prompt;
  }
}
