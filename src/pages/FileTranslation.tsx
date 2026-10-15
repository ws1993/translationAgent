import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { MarkdownParserService, ParsedMarkdown } from '../services/file/MarkdownParserService';
import { DomainAdaptiveTranslationService } from '../services/translation/DomainAdaptiveTranslationService';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { 
  Upload, 
  FileText, 
  Play, 
  Download, 
  Copy, 
  RefreshCw, 
  Columns, 
  Search, 
  Clock, 
  CheckCircle, 
  Loader2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Settings,
  BarChart3,
  List,
  Table,
  Code,
  Quote,
  Minus,
  Type
} from 'lucide-react';

interface TranslationProgress {
  stage: 'idle' | 'domain' | 'terminology' | 'direct' | 'issues' | 'final';
  progress: number;
  domainInfo?: any;
  terminology?: any[];
  directTranslation?: string;
  issues?: string[];
  finalTranslation?: string;
}

interface FileTranslationState {
  file: File | null;
  parsedMarkdown: ParsedMarkdown | null;
  translatedSections: Map<string, string>;
  isTranslating: boolean;
  progress: TranslationProgress;
  selectedSectionId: string | null;
  syncScroll: boolean;
  splitView: boolean;
}

function FileTranslation() {
  const [state, setState] = useState<FileTranslationState>({
    file: null,
    parsedMarkdown: null,
    translatedSections: new Map(),
    isTranslating: false,
    progress: { stage: 'idle', progress: 0 },
    selectedSectionId: null,
    syncScroll: true,
    splitView: true,
  });
  
  const sourcePanelRef = useRef<HTMLDivElement>(null);
  const targetPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { getActiveConfig } = useLLMConfigStore();
  
  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      toast.error('请上传 Markdown 文件（.md 或 .markdown）');
      return;
    }
    
    try {
      const parsed = await MarkdownParserService.parseFile(file);
      setState(prev => ({
        ...prev,
        file,
        parsedMarkdown: parsed,
        translatedSections: new Map(),
        selectedSectionId: null,
      }));
      toast.success(`文件 "${file.name}" 加载成功`);
    } catch (error) {
      console.error('File parsing error:', error);
      toast.error('文件解析失败');
    }
  };
  
  // 处理拖放上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // 开始翻译
  const handleStartTranslation = async () => {
    if (!state.parsedMarkdown) {
      toast.error('请先上传文件');
      return;
    }
    
    const activeConfig = getActiveConfig();
    if (!activeConfig) {
      toast.error('请先在设置页面配置大模型');
      return;
    }
    
    setState(prev => ({ ...prev, isTranslating: true, progress: { stage: 'idle', progress: 0 } }));
    
    try {
      const translationService = new DomainAdaptiveTranslationService(activeConfig);
      const translatedSections = new Map<string, string>();
      
      // 翻译每个段落
      const sections = state.parsedMarkdown.sections;
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        // 跳过代码块（不翻译代码）
        if (section.type === 'code') {
          translatedSections.set(section.id, section.content);
          continue;
        }
        
        // 更新进度
        const progress = Math.round(((i + 1) / sections.length) * 100);
        setState(prev => ({
          ...prev,
          progress: { stage: 'final', progress }
        }));
        
        // 翻译内容
        try {
          const result = await translationService.translate(section.content);
          translatedSections.set(section.id, result.finalTranslation || section.content);
        } catch (error) {
          console.error(`Translation error for section ${section.id}:`, error);
          translatedSections.set(section.id, section.content);
        }
      }
      
      setState(prev => ({
        ...prev,
        translatedSections,
        isTranslating: false,
        progress: { stage: 'idle', progress: 100 }
      }));
      
      toast.success('翻译完成');
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(`翻译失败: ${error.message}`);
      setState(prev => ({ ...prev, isTranslating: false }));
    }
  };
  
  // 同步滚动
  const handleSyncScroll = (source: 'source' | 'target') => {
    if (!state.syncScroll) return;
    
    const sourcePanel = sourcePanelRef.current;
    const targetPanel = targetPanelRef.current;
    
    if (source === 'source' && sourcePanel && targetPanel) {
      targetPanel.scrollTop = sourcePanel.scrollTop;
    } else if (source === 'target' && sourcePanel && targetPanel) {
      sourcePanel.scrollTop = targetPanel.scrollTop;
    }
  };
  
  // 获取目录结构
  const getTableOfContents = () => {
    if (!state.parsedMarkdown) return [];
    return MarkdownParserService.getTableOfContents(state.parsedMarkdown);
  };
  
  // 获取统计信息
  const getStatistics = () => {
    if (!state.parsedMarkdown) return null;
    return MarkdownParserService.getStatistics(state.parsedMarkdown);
  };
  
  // 渲染Markdown内容
  const renderMarkdownContent = (content: string, isSource: boolean) => {
    if (!state.parsedMarkdown) return null;
    
    const sections = state.parsedMarkdown.sections;
    
    return sections.map((section) => {
      const translatedContent = isSource ? section.content : state.translatedSections.get(section.id) || section.content;
      
      switch (section.type) {
        case 'heading':
          const HeadingTag = `h${section.level}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag 
              key={section.id}
              className={`font-serif font-semibold ${
                section.level === 1 ? 'text-2xl mt-8 mb-4' :
                section.level === 2 ? 'text-xl mt-6 mb-3' :
                'text-lg mt-4 mb-2'
              }`}
            >
              {translatedContent}
            </HeadingTag>
          );
          
        case 'code':
          return (
            <pre key={section.id} className="bg-surface-1 p-4 rounded-lg my-4 overflow-x-auto">
              <code className="text-sm font-mono">
                {translatedContent}
              </code>
            </pre>
          );
          
        case 'list':
          const items = translatedContent.split('\n');
          const isOrdered = section.metadata?.ordered;
          const ListTag = isOrdered ? 'ol' : 'ul';
          return (
            <ListTag key={section.id} className={`${isOrdered ? 'list-decimal' : 'list-disc'} pl-6 my-4 space-y-1`}>
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ListTag>
          );
          
        case 'blockquote':
          return (
            <blockquote key={section.id} className="border-l-4 border-accent pl-4 my-4 italic text-muted">
              {translatedContent}
            </blockquote>
          );
          
        case 'table':
          if (!section.metadata?.headers) return null;
          return (
            <div key={section.id} className="overflow-x-auto my-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-1">
                    {section.metadata.headers.map((header, index) => (
                      <th key={index} className="border border-border p-2 text-left font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.metadata.rows?.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-border p-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          
        case 'hr':
          return <hr key={section.id} className="my-6 border-border" />;
          
        default: // paragraph
          return (
            <p key={section.id} className="my-4 leading-relaxed">
              {translatedContent}
            </p>
          );
      }
    });
  };
  
  // 获取段落图标
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'heading': return <Type className="w-4 h-4" />;
      case 'code': return <Code className="w-4 h-4" />;
      case 'list': return <List className="w-4 h-4" />;
      case 'blockquote': return <Quote className="w-4 h-4" />;
      case 'table': return <Table className="w-4 h-4" />;
      case 'hr': return <Minus className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };
  
  const statistics = getStatistics();
  const tableOfContents = getTableOfContents();
  
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-surface border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-serif font-semibold text-ink">
            <span className="text-accent italic">文件翻译</span>
          </h1>
          
          {state.file && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <FileText className="w-4 h-4" />
              <span>{state.file.name}</span>
              {statistics && (
                <>
                  <span>·</span>
                  <span>{statistics.totalLines} 行</span>
                  <span>·</span>
                  <span>{statistics.totalWords} 字</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, syncScroll: !prev.syncScroll }))}
            className={state.syncScroll ? 'text-accent' : 'text-muted'}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            同步滚动
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, splitView: !prev.splitView }))}
            className={state.splitView ? 'text-accent' : 'text-muted'}
          >
            <Columns className="w-4 h-4 mr-1" />
            分屏模式
          </Button>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        <aside className="w-64 bg-surface border-r border-border flex flex-col">
          {/* 文件上传区 */}
          <div className="p-4 border-b border-border">
            <div 
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent hover:bg-accent-tint transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">拖放 Markdown 文件</p>
              <p className="text-xs text-muted">或点击选择文件</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          </div>
          
          {/* 翻译进度 */}
          {state.isTranslating && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">翻译进度</span>
                <span className="text-xs text-accent">{state.progress.progress}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.progress.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted">
                <span>正在翻译...</span>
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
            </div>
          )}
          
          {/* 目录导航 */}
          {tableOfContents.length > 0 && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                文档目录
              </h3>
              <div className="space-y-1">
                {tableOfContents.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent-tint transition-colors ${
                      state.selectedSectionId === item.id ? 'bg-accent text-white' : 'text-muted hover:text-ink'
                    }`}
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                    onClick={() => {
                      setState(prev => ({ ...prev, selectedSectionId: item.id }));
                      // 滚动到对应位置
                      const element = document.getElementById(`section-${item.line}`);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {item.level > 1 && <ChevronRight className="w-3 h-3" />}
                    <span className="text-sm truncate">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 底部操作 */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                disabled={!state.parsedMarkdown}
              >
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                disabled={!state.translatedSections.size}
              >
                <Copy className="w-4 h-4 mr-1" />
                复制
              </Button>
            </div>
          </div>
        </aside>
        
        {/* 双面板编辑区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 原文面板 */}
          <div className="flex-1 flex flex-col border-r border-border">
            <div className="h-10 bg-surface-1 border-b border-border flex items-center px-4">
              <span className="text-sm font-medium">原文</span>
              {statistics && (
                <span className="ml-2 text-xs text-muted">{statistics.totalLines} 行</span>
              )}
            </div>
            <div 
              ref={sourcePanelRef}
              className="flex-1 overflow-y-auto p-6 bg-white"
              onScroll={() => handleSyncScroll('source')}
            >
              {state.parsedMarkdown ? (
                <div className="prose max-w-none">
                  {renderMarkdownContent('', true)}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>上传 Markdown 文件开始翻译</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 译文面板 */}
          <div className="flex-1 flex flex-col">
            <div className="h-10 bg-surface-1 border-b border-border flex items-center px-4">
              <span className="text-sm font-medium">译文</span>
              {state.translatedSections.size > 0 && (
                <span className="ml-2 text-xs text-muted">
                  {state.translatedSections.size} 个段落已翻译
                </span>
              )}
            </div>
            <div 
              ref={targetPanelRef}
              className="flex-1 overflow-y-auto p-6 bg-white"
              onScroll={() => handleSyncScroll('target')}
            >
              {state.translatedSections.size > 0 ? (
                <div className="prose max-w-none">
                  {renderMarkdownContent('', false)}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>翻译结果将显示在这里</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 右侧边栏 - 翻译报告 */}
        <aside className="w-80 bg-surface border-l border-border flex flex-col">
          <div className="h-12 border-b border-border flex items-center px-4">
            <span className="text-sm font-medium">翻译报告</span>
          </div>
          
          {/* 统计信息 */}
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-1 rounded-lg p-3">
                <p className="text-xs text-muted mb-1">总字数</p>
                <p className="text-lg font-semibold">{statistics?.totalWords || 0}</p>
              </div>
              <div className="bg-surface-1 rounded-lg p-3">
                <p className="text-xs text-muted mb-1">段落数</p>
                <p className="text-lg font-semibold">{statistics?.sectionCount || 0}</p>
              </div>
              <div className="bg-surface-1 rounded-lg p-3">
                <p className="text-xs text-muted mb-1">代码块</p>
                <p className="text-lg font-semibold">{statistics?.codeBlockCount || 0}</p>
              </div>
              <div className="bg-surface-1 rounded-lg p-3">
                <p className="text-xs text-muted mb-1">链接数</p>
                <p className="text-lg font-semibold">{statistics?.linkCount || 0}</p>
              </div>
            </div>
          </div>
          
          {/* 翻译状态 */}
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold mb-3">翻译状态</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>进度</span>
                  <span className="text-accent">{state.progress.progress}%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                {state.isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>正在翻译...</span>
                  </>
                ) : state.progress.progress === 100 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>翻译完成</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-muted" />
                    <span>等待开始</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="p-4 mt-auto">
            <Button 
              className="w-full" 
              onClick={handleStartTranslation}
              disabled={!state.parsedMarkdown || state.isTranslating}
            >
              {state.isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  翻译中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  开始翻译
                </>
              )}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default FileTranslation;