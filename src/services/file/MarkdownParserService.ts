import { marked } from 'marked';

export interface MarkdownSection {
  id: string;
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'blockquote' | 'table' | 'html' | 'hr';
  level?: number; // For headings: 1-6
  content: string;
  rawContent: string;
  children?: MarkdownSection[];
  metadata?: {
    language?: string; // For code blocks
    ordered?: boolean; // For lists
    items?: string[]; // For list items
    headers?: string[]; // For tables
    rows?: string[][]; // For tables
  };
}

export interface ParsedMarkdown {
  title: string;
  sections: MarkdownSection[];
  rawContent: string;
  lineCount: number;
  wordCount: number;
  structure: {
    headings: { level: number; text: string; line: number }[];
    codeBlocks: { language: string; line: number }[];
    links: { text: string; url: string; line: number }[];
  };
}

export class MarkdownParserService {
  /**
   * 解析Markdown内容并保留结构
   */
  static parse(content: string): ParsedMarkdown {
    const lines = content.split('\n');
    const sections: MarkdownSection[] = [];
    const headings: { level: number; text: string; line: number }[] = [];
    const codeBlocks: { language: string; line: number }[] = [];
    const links: { text: string; url: string; line: number }[] = [];
    
    let currentSection: MarkdownSection | null = null;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLanguage = '';
    let codeBlockStartLine = 0;
    let listItems: string[] = [];
    let inList = false;
    let listType: 'ordered' | 'unordered' = 'unordered';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // 处理代码块
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // 结束代码块
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            id: `code-${codeBlockStartLine}`,
            type: 'code',
            content: codeBlockContent.trim(),
            rawContent: lines.slice(codeBlockStartLine - 1, i + 1).join('\n'),
            metadata: {
              language: codeBlockLanguage
            }
          };
          sections.push(currentSection);
          codeBlocks.push({ language: codeBlockLanguage, line: codeBlockStartLine });
          currentSection = null;
          inCodeBlock = false;
          codeBlockContent = '';
          continue;
        } else {
          // 开始代码块
          if (currentSection) {
            sections.push(currentSection);
          }
          inCodeBlock = true;
          codeBlockLanguage = line.trim().slice(3).trim();
          codeBlockStartLine = lineNumber;
          currentSection = null;
          continue;
        }
      }
      
      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }
      
      // 处理标题
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        headings.push({ level, text, line: lineNumber });
        
        currentSection = {
          id: `heading-${lineNumber}`,
          type: 'heading',
          level,
          content: text,
          rawContent: line,
        };
        sections.push(currentSection);
        currentSection = null;
        continue;
      }
      
      // 处理列表
      const unorderedListMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      const orderedListMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      
      if (unorderedListMatch || orderedListMatch) {
        if (!inList) {
          if (currentSection) {
            sections.push(currentSection);
          }
          inList = true;
          listType = unorderedListMatch ? 'unordered' : 'ordered';
          listItems = [];
        }
        const itemContent = unorderedListMatch ? unorderedListMatch[1] : orderedListMatch![1];
        listItems.push(itemContent);
        continue;
      } else if (inList) {
        // 列表结束
        currentSection = {
          id: `list-${lineNumber - listItems.length}`,
          type: 'list',
          content: listItems.join('\n'),
          rawContent: listItems.map((item, index) => {
            const prefix = listType === 'ordered' ? `${index + 1}.` : '-';
            return `${prefix} ${item}`;
          }).join('\n'),
          metadata: {
            ordered: listType === 'ordered',
            items: listItems
          }
        };
        sections.push(currentSection);
        inList = false;
        listItems = [];
        currentSection = null;
      }
      
      // 处理引用块
      if (line.trim().startsWith('>')) {
        if (currentSection?.type !== 'blockquote') {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            id: `blockquote-${lineNumber}`,
            type: 'blockquote',
            content: '',
            rawContent: ''
          };
        }
        const quoteContent = line.replace(/^>\s*/, '');
        currentSection.content += quoteContent + '\n';
        currentSection.rawContent += line + '\n';
        continue;
      }
      
      // 处理水平线
      if (line.trim().match(/^[-*_]{3,}$/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `hr-${lineNumber}`,
          type: 'hr',
          content: '',
          rawContent: line
        };
        sections.push(currentSection);
        currentSection = null;
        continue;
      }
      
      // 处理表格
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (currentSection?.type !== 'table') {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            id: `table-${lineNumber}`,
            type: 'table',
            content: '',
            rawContent: '',
            metadata: {
              headers: [],
              rows: []
            }
          };
        }
        
        const cells = line.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
        
        // 检查是否是分隔行
        if (cells.every(cell => cell.match(/^[-:]+$/))) {
          // 这是表格分隔行，跳过
          currentSection.rawContent += line + '\n';
          return;
        }
        
        if (currentSection.metadata?.headers?.length === 0) {
          // 第一行是表头
          currentSection.metadata!.headers = cells;
        } else {
          // 数据行
          currentSection.metadata!.rows.push(cells);
        }
        currentSection.content = cells.join(' | ');
        currentSection.rawContent += line + '\n';
        continue;
      }
      
      // 处理普通段落
      if (line.trim() === '') {
        if (currentSection) {
          sections.push(currentSection);
          currentSection = null;
        }
        continue;
      }
      
      // 提取链接
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(line)) !== null) {
        links.push({
          text: linkMatch[1],
          url: linkMatch[2],
          line: lineNumber
        });
      }
      
      // 普通文本
      if (!currentSection || currentSection.type !== 'paragraph') {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `paragraph-${lineNumber}`,
          type: 'paragraph',
          content: line,
          rawContent: line
        };
      } else {
        currentSection.content += '\n' + line;
        currentSection.rawContent += '\n' + line;
      }
    }
    
    // 处理最后的段落或列表
    if (currentSection) {
      sections.push(currentSection);
    }
    if (inList && listItems.length > 0) {
      sections.push({
        id: `list-${lines.length}`,
        type: 'list',
        content: listItems.join('\n'),
        rawContent: listItems.map((item, index) => {
          const prefix = listType === 'ordered' ? `${index + 1}.` : '-';
          return `${prefix} ${item}`;
        }).join('\n'),
        metadata: {
          ordered: listType === 'ordered',
          items: listItems
        }
      });
    }
    
    // 计算字数（中文按字符，英文按单词）
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = content.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(word => word.length > 0).length;
    const wordCount = chineseChars + englishWords;
    
    // 提取标题作为文档标题
    const title = headings.length > 0 ? headings[0].text : 'Untitled Document';
    
    return {
      title,
      sections,
      rawContent: content,
      lineCount: lines.length,
      wordCount,
      structure: {
        headings,
        codeBlocks,
        links
      }
    };
  }
  
  /**
   * 从文件对象解析Markdown
   */
  static async parseFile(file: File): Promise<ParsedMarkdown> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          resolve(this.parse(content));
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
  
  /**
   * 重建Markdown内容，保持原始结构
   */
  static rebuild(parsed: ParsedMarkdown): string {
    return parsed.sections.map(section => section.rawContent).join('\n\n');
  }
  
  /**
   * 获取文档目录结构
   */
  static getTableOfContents(parsed: ParsedMarkdown): { level: number; text: string; line: number; id: string }[] {
    return parsed.structure.headings.map((heading, index) => ({
      level: heading.level,
      text: heading.text,
      line: heading.line,
      id: `toc-${index}`
    }));
  }
  
  /**
   * 统计文档信息
   */
  static getStatistics(parsed: ParsedMarkdown): {
    totalLines: number;
    totalWords: number;
    headingCount: number;
    codeBlockCount: number;
    linkCount: number;
    sectionCount: number;
  } {
    return {
      totalLines: parsed.lineCount,
      totalWords: parsed.wordCount,
      headingCount: parsed.structure.headings.length,
      codeBlockCount: parsed.structure.codeBlocks.length,
      linkCount: parsed.structure.links.length,
      sectionCount: parsed.sections.length
    };
  }
}