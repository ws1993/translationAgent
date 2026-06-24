export enum TranslationMode {
  QUICK = 'quick',
  PROFESSIONAL = 'professional',
}

export enum OutputFormat {
  BILINGUAL = 'bilingual',
  TRANSLATION_ONLY = 'translation_only',
}

export enum Language {
  ZH_CN = 'zh-CN',
  EN = 'en',
}

export interface DomainCategory {
  id: string;
  name: string;
  parentId: string | null;
  level: 1 | 2;
  prompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationTask {
  id: string;
  sourceText: string;
  sourceLang: Language;
  targetLang: Language;
  mode: TranslationMode;
  outputFormat: OutputFormat;
  domainId?: string;
  result?: TranslationResult;
  createdAt: string;
}

export interface TranslationResult {
  directTranslation?: string;
  issues?: string[];
  finalTranslation: string;
}

export interface LLMConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  isActive: boolean;
}

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
  autoSync: boolean;
  syncInterval: number;
  conflictStrategy: 'server' | 'local' | 'prompt';
  lastSyncAt?: string;
}
