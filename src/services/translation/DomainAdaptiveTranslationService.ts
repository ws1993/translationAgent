import { LLMService, LLMMessage } from '../llm/LLMService';
import { LLMConfig, Language, TranslationResult, DomainInfo, TerminologyItem } from '../../types';
import { detectLanguage } from '../../utils/languageDetector';

export type DomainAdaptiveProgressCallback = (
  stage: 'domain' | 'terminology' | 'direct' | 'issues' | 'final',
  progress: number,
  result?: any
) => void;

export class DomainAdaptiveTranslationService {
  private llmService: LLMService;

  constructor(config: LLMConfig) {
    this.llmService = new LLMService(config);
  }

  async translate(
    sourceText: string,
    sourceLang?: Language,
    onProgress?: DomainAdaptiveProgressCallback
  ): Promise<TranslationResult> {
    const detectedLang = sourceLang || detectLanguage(sourceText);
    const targetLang = detectedLang === Language.ZH_CN ? Language.EN : Language.ZH_CN;
    const targetLanguageName = targetLang === Language.ZH_CN ? '简体中文' : 'English';
    const sourceLanguageName = detectedLang === Language.ZH_CN ? '中文' : '英文';

    onProgress?.('domain', 0);
    const domainInfo = await this.identifyDomain(sourceText, sourceLanguageName);
    console.log('[DomainAdaptive] Domain identified:', domainInfo);
    onProgress?.('domain', 100, domainInfo);

    onProgress?.('terminology', 0);
    const terminology = await this.generateTerminology(
      sourceText,
      domainInfo,
      sourceLanguageName,
      targetLanguageName
    );
    console.log('[DomainAdaptive] Terminology generated:', terminology.length, 'terms');
    onProgress?.('terminology', 100, terminology);

    const domainPrompt = this.buildDomainPrompt(domainInfo, terminology, targetLanguageName);
    
    const baseSystemPrompt = `你是一位精通${sourceLanguageName}和${targetLanguageName}的专业翻译，特别擅长${domainInfo.primaryDomain}领域的翻译。请确保输出的文本编码正确，使用UTF-8编码。`;

    onProgress?.('direct', 0);
    const directTranslationPrompt = `${domainPrompt}

请将以下${sourceLanguageName}文本直译成${targetLanguageName}，保持原有格式，不要遗漏任何信息。

严格要求：
- 【必须】直接输出翻译结果，不要添加任何前缀、标题或说明
- 【禁止】添加"直译结果："、"翻译如下："等任何形式的前缀
- 【禁止】在结尾添加任何总结、评论或说明
- 【禁止】输出除了译文本身以外的任何内容
- 【必须】严格遵守上述术语表中的译法
- 【必须】确保使用正确的字符编码

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
    console.log('[DomainAdaptive] Direct translation completed');
    onProgress?.('direct', 100, directTranslation);

    onProgress?.('issues', 0);
    const issuesPrompt = `根据以下直译结果，从${domainInfo.primaryDomain}领域的专业角度，指出其中存在的具体问题，包括但不限于：
- 专业术语使用不准确或不一致的地方
- 不符合${targetLanguageName}表达习惯的地方
- 语句不通顺的位置
- 晦涩难懂、不易理解的内容
- 领域内特有的表达方式未体现的地方

直译结果：
${directTranslation}

请以列表形式列出具体问题：`;

    const issuesMessages: LLMMessage[] = [
      { role: 'system', content: baseSystemPrompt },
      { role: 'user', content: issuesPrompt },
    ];

    const issuesResponse = await this.llmService.sendMessage(issuesMessages);
    const issues = issuesResponse.content.split('\n').filter(line => line.trim());
    console.log('[DomainAdaptive] Issues analysis completed:', issues.length, 'issues found');
    onProgress?.('issues', 100, issues);

    onProgress?.('final', 0);
    const finalPrompt = `根据直译结果和指出的问题，从${domainInfo.primaryDomain}领域的专业角度重新进行意译。在保证内容原意的基础上，使其更易于理解，更符合${targetLanguageName}在该领域的表达习惯，同时保持原有的格式不变。

直译结果：
${directTranslation}

存在的问题：
${issues.join('\n')}

领域约束：
${domainPrompt}

严格要求：
- 【必须】直接输出最终的译文，不要添加任何前缀、标题、说明或总结
- 【禁止】添加"意译结果："、"最终译文："、"译文如下："等任何形式的前缀
- 【禁止】在结尾添加任何总结、评论、说明或额外的话
- 【禁止】输出除了译文本身以外的任何内容
- 【必须】严格遵守术语表中的专业术语译法
- 【必须】确保使用正确的字符编码
- 【重要】你的输出应该可以直接作为最终译文使用，不需要任何后处理`;

    const finalMessages: LLMMessage[] = [
      { role: 'system', content: baseSystemPrompt },
      { role: 'user', content: finalPrompt },
    ];

    const finalResponse = await this.llmService.sendMessageStream(finalMessages, (chunk, fullText) => {
      onProgress?.('final', Math.min(95, Math.floor((fullText.length / (sourceText.length * 2)) * 100)), fullText);
    });
    const finalTranslation = finalResponse.content.trim();
    console.log('[DomainAdaptive] Final translation completed');
    onProgress?.('final', 100, finalTranslation);

    return {
      directTranslation,
      issues,
      finalTranslation,
      domainInfo,
      terminology,
    };
  }

  private async identifyDomain(sourceText: string, sourceLanguageName: string): Promise<DomainInfo> {
    const systemPrompt = `你是一位专业的文本领域分类专家，能够准确识别文本所属的专业领域。`;

    const userPrompt = `请分析以下${sourceLanguageName}文本，识别其所属的专业领域。

文本内容：
${sourceText}

请以 JSON 格式输出分析结果，包含以下字段：
- primaryDomain: 主要领域（如：技术、法律、医疗、金融、文学、商业、教育等）
- subDomain: 子领域（可选，如：软件开发、合同法、心血管医学等）
- confidence: 置信度（0-1之间的小数）
- reasoning: 判断理由（简要说明为什么属于这个领域）

示例输出格式：
\`\`\`json
{
  "primaryDomain": "技术",
  "subDomain": "人工智能",
  "confidence": 0.95,
  "reasoning": "文本包含大量AI、机器学习相关术语，讨论模型训练和算法优化"
}
\`\`\`

请直接输出JSON，不要添加其他说明：`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.llmService.sendMessage(messages);
    
    try {
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.content;
      const domainInfo = JSON.parse(jsonStr.trim());
      
      return {
        primaryDomain: domainInfo.primaryDomain || '通用',
        subDomain: domainInfo.subDomain,
        confidence: domainInfo.confidence || 0.5,
        reasoning: domainInfo.reasoning || '无法确定具体原因',
      };
    } catch (error) {
      console.error('[DomainAdaptive] Failed to parse domain info:', error);
      return {
        primaryDomain: '通用',
        confidence: 0.3,
        reasoning: '自动识别失败，使用通用领域',
      };
    }
  }

  private async generateTerminology(
    sourceText: string,
    domainInfo: DomainInfo,
    sourceLanguageName: string,
    targetLanguageName: string
  ): Promise<TerminologyItem[]> {
    const systemPrompt = `你是一位${domainInfo.primaryDomain}领域的专业术语专家，精通${sourceLanguageName}和${targetLanguageName}的专业术语对照。`;

    const userPrompt = `请根据以下文本内容，生成该文本中涉及的${domainInfo.primaryDomain}领域专业术语的双语对照表。

领域：${domainInfo.primaryDomain}${domainInfo.subDomain ? ` - ${domainInfo.subDomain}` : ''}

文本内容：
${sourceText}

要求：
1. 识别文本中的专业术语、固定表达、技术名词
2. 给出准确的${targetLanguageName}对应翻译
3. 优先考虑该领域的标准译法和行业惯例
4. 每个术语提供使用场景说明（可选）
5. 如有特殊注意事项，请在 notes 中说明

请以 JSON 数组格式输出，每项包含：
- source: 源语言术语
- target: 目标语言对应翻译
- context: 使用场景（可选）
- notes: 翻译注意事项（可选）

示例输出格式：
\`\`\`json
[
  {
    "source": "机器学习",
    "target": "Machine Learning",
    "context": "AI技术分支",
    "notes": "行业标准译法，不翻译为 Machine Study"
  },
  {
    "source": "神经网络",
    "target": "Neural Network",
    "context": "深度学习基础架构"
  }
]
\`\`\`

请直接输出JSON数组，不要添加其他说明：`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.llmService.sendMessage(messages);
    
    try {
      console.log('[DomainAdaptive] Raw terminology response:', response.content.substring(0, 500));
      
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.content.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        console.warn('[DomainAdaptive] No JSON found in response, returning empty terminology');
        return [];
      }
      
      const jsonStr = (jsonMatch[1] || jsonMatch[0]).trim();
      
      if (!jsonStr) {
        console.warn('[DomainAdaptive] Empty JSON string, returning empty terminology');
        return [];
      }
      
      const terminology = JSON.parse(jsonStr);
      
      if (Array.isArray(terminology)) {
        console.log('[DomainAdaptive] Successfully parsed', terminology.length, 'terms');
        return terminology;
      }
      
      console.warn('[DomainAdaptive] Parsed result is not an array:', typeof terminology);
      return [];
    } catch (error) {
      console.error('[DomainAdaptive] Failed to parse terminology:', error);
      console.error('[DomainAdaptive] Response content length:', response.content.length);
      console.error('[DomainAdaptive] Response preview:', response.content.substring(0, 200));
      return [];
    }
  }

  private buildDomainPrompt(
    domainInfo: DomainInfo,
    terminology: TerminologyItem[],
    targetLanguageName: string
  ): string {
    let prompt = `## 领域背景
本文属于【${domainInfo.primaryDomain}】领域`;

    if (domainInfo.subDomain) {
      prompt += `，细分领域为【${domainInfo.subDomain}】`;
    }

    prompt += `。\n判断依据：${domainInfo.reasoning}\n`;

    if (terminology.length > 0) {
      prompt += `\n## 专业术语表（必须严格遵守）\n`;
      terminology.forEach((term, index) => {
        prompt += `${index + 1}. ${term.source} → ${term.target}`;
        if (term.context) {
          prompt += ` (${term.context})`;
        }
        if (term.notes) {
          prompt += `\n   注意：${term.notes}`;
        }
        prompt += '\n';
      });
    }

    prompt += `\n## 翻译要求
- 严格遵守上述术语表中的译法，确保专业术语翻译的准确性和一致性
- 符合${domainInfo.primaryDomain}领域的表达习惯和专业规范
- 保持原文的专业性和严谨性`;

    return prompt;
  }
}
