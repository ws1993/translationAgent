import { createClient, WebDAVClient, FileStat } from 'webdav';
import { WebDAVConfig, LLMConfig } from '../../types';
import CryptoJS from 'crypto-js';

export interface SyncResult {
  success: boolean;
  action: 'upload' | 'download' | 'skip' | 'conflict';
  message: string;
  remoteData?: LLMConfig[];
  localData?: LLMConfig[];
}

export class WebDAVService {
  private client: WebDAVClient | null = null;
  private config: WebDAVConfig | null = null;
  private readonly basePath = '/translationAgent';
  private readonly configFileName = 'llm-config.json';

  constructor(config?: WebDAVConfig) {
    if (config) {
      this.setConfig(config);
    }
  }

  setConfig(config: WebDAVConfig) {
    this.config = config;
    this.client = createClient(config.url, {
      username: config.username,
      password: config.password,
      headers: {
        'User-Agent': 'TranslationAgent/1.0',
      },
    });
  }

  private ensureClient(): WebDAVClient {
    if (!this.client || !this.config) {
      throw new Error('WebDAV 未配置');
    }
    return this.client;
  }

  private getConfigPath(): string {
    return `${this.basePath}/${this.configFileName}`;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const client = this.ensureClient();
      
      // 先简单测试根目录访问
      const testResult = await client.getDirectoryContents('/').catch(() => null);
      
      if (testResult === null) {
        return { 
          success: false, 
          message: '无法访问 WebDAV 服务器，请检查：\n1. URL 格式是否正确（坚果云：https://dav.jianguoyun.com/dav/）\n2. 用户名和密码是否正确\n3. 浏览器 CORS 限制（可能需要使用浏览器插件或桌面应用）' 
        };
      }

      // 测试目录是否存在，不存在则创建
      const dirExists = await client.exists(this.basePath);
      if (!dirExists) {
        await client.createDirectory(this.basePath);
      }

      // 测试写入权限
      const testFilePath = `${this.basePath}/.test-${Date.now()}.tmp`;
      const testContent = JSON.stringify({ test: true, timestamp: Date.now() });
      
      await client.putFileContents(testFilePath, testContent, { overwrite: true });
      
      // 测试读取权限
      const readContent = await client.getFileContents(testFilePath, { format: 'text' }) as string;
      const parsed = JSON.parse(readContent);
      
      // 清理测试文件
      await client.deleteFile(testFilePath);

      if (parsed.test === true) {
        return { success: true, message: '连接成功，具备读写权限' };
      } else {
        return { success: false, message: '读写验证失败' };
      }
    } catch (error: any) {
      console.error('WebDAV connection test failed:', error);
      
      let errorMessage = '连接失败';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = '网络错误：无法连接到 WebDAV 服务器。\n\n可能原因：\n1. CORS 跨域限制（浏览器安全策略）\n2. URL 地址错误\n3. 网络连接问题\n\n建议：\n- 安装浏览器 CORS 插件（如 CORS Unblock）\n- 或使用桌面版应用（Electron 打包后无此限制）';
      } else if (error.status === 401) {
        errorMessage = '认证失败：用户名或密码错误';
      } else if (error.status === 403) {
        errorMessage = '权限不足：无访问权限';
      } else if (error.status === 404) {
        errorMessage = 'WebDAV 服务地址不存在';
      } else {
        errorMessage = `连接失败: ${error.message || '未知错误'}`;
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  }

  private async ensureDirectory(): Promise<void> {
    const client = this.ensureClient();
    const dirExists = await client.exists(this.basePath);
    if (!dirExists) {
      await client.createDirectory(this.basePath);
    }
  }

  async uploadConfig(configs: LLMConfig[]): Promise<void> {
    const client = this.ensureClient();
    await this.ensureDirectory();

    const configPath = this.getConfigPath();
    const content = JSON.stringify(configs, null, 2);
    
    await client.putFileContents(configPath, content, { overwrite: true });
  }

  async downloadConfig(): Promise<LLMConfig[] | null> {
    try {
      const client = this.ensureClient();
      const configPath = this.getConfigPath();

      const exists = await client.exists(configPath);
      if (!exists) {
        return null;
      }

      const content = await client.getFileContents(configPath, { format: 'text' }) as string;
      const configs = JSON.parse(content);
      
      return Array.isArray(configs) ? configs : null;
    } catch (error: any) {
      console.error('Download config failed:', error);
      return null;
    }
  }

  async getRemoteModifiedTime(): Promise<string | null> {
    try {
      const client = this.ensureClient();
      const configPath = this.getConfigPath();

      const exists = await client.exists(configPath);
      if (!exists) {
        return null;
      }

      const stat = await client.stat(configPath) as FileStat;
      return stat.lastmod || null;
    } catch (error) {
      console.error('Get remote modified time failed:', error);
      return null;
    }
  }

  mergeConfigs(
    localConfigs: LLMConfig[],
    remoteConfigs: LLMConfig[]
  ): LLMConfig[] {
    const merged = new Map<string, LLMConfig>();

    // 先添加所有本地配置
    localConfigs.forEach(config => {
      merged.set(config.id, config);
    });

    // 合并远程配置
    remoteConfigs.forEach(remoteConfig => {
      const localConfig = merged.get(remoteConfig.id);
      
      if (!localConfig) {
        // 远程独有，直接添加
        merged.set(remoteConfig.id, remoteConfig);
      } else {
        // ID 相同，需要根据策略处理（这里返回冲突标记，由调用方处理）
        // 暂时保留本地版本，实际冲突处理在 sync 方法中
      }
    });

    return Array.from(merged.values());
  }

  detectConflicts(
    localConfigs: LLMConfig[],
    remoteConfigs: LLMConfig[]
  ): { hasConflict: boolean; conflictIds: string[] } {
    const conflicts: string[] = [];
    const remoteMap = new Map(remoteConfigs.map(c => [c.id, c]));

    localConfigs.forEach(localConfig => {
      const remoteConfig = remoteMap.get(localConfig.id);
      if (remoteConfig) {
        // 比较配置是否不同（简单的 JSON 字符串比较）
        const localStr = JSON.stringify(this.normalizeConfig(localConfig));
        const remoteStr = JSON.stringify(this.normalizeConfig(remoteConfig));
        
        if (localStr !== remoteStr) {
          conflicts.push(localConfig.id);
        }
      }
    });

    return {
      hasConflict: conflicts.length > 0,
      conflictIds: conflicts,
    };
  }

  private normalizeConfig(config: LLMConfig): any {
    // 移除 isActive 字段，因为这是本地状态，不参与冲突比较
    const { isActive, ...rest } = config;
    return rest;
  }

  async sync(
    localConfigs: LLMConfig[],
    lastSyncAt?: string
  ): Promise<SyncResult> {
    try {
      const client = this.ensureClient();
      const configPath = this.getConfigPath();

      // 检查远程文件是否存在
      const remoteExists = await client.exists(configPath);

      // 场景1: 远程不存在，直接上传
      if (!remoteExists) {
        await this.uploadConfig(localConfigs);
        return {
          success: true,
          action: 'upload',
          message: '首次同步，已上传本地配置到服务器',
        };
      }

      // 场景2: 远程存在，下载并比较
      const remoteConfigs = await this.downloadConfig();
      if (!remoteConfigs) {
        return {
          success: false,
          action: 'skip',
          message: '远程配置格式错误',
        };
      }

      // 检测冲突
      const { hasConflict, conflictIds } = this.detectConflicts(localConfigs, remoteConfigs);

      if (!hasConflict) {
        // 无冲突，按 ID 合并
        const merged = this.mergeConfigs(localConfigs, remoteConfigs);
        
        // 如果合并后有变化，上传更新
        if (JSON.stringify(merged) !== JSON.stringify(remoteConfigs)) {
          await this.uploadConfig(merged);
          return {
            success: true,
            action: 'upload',
            message: '配置已合并并同步到服务器',
            localData: merged,
          };
        } else {
          return {
            success: true,
            action: 'skip',
            message: '配置已是最新，无需同步',
          };
        }
      }

      // 有冲突，根据策略处理
      const strategy = this.config!.conflictStrategy;

      if (strategy === 'server') {
        // 服务器优先
        return {
          success: true,
          action: 'download',
          message: `检测到 ${conflictIds.length} 个冲突配置，已使用服务器版本`,
          localData: remoteConfigs,
        };
      } else if (strategy === 'local') {
        // 本地优先
        await this.uploadConfig(localConfigs);
        return {
          success: true,
          action: 'upload',
          message: `检测到 ${conflictIds.length} 个冲突配置，已使用本地版本`,
        };
      } else {
        // 提示用户
        return {
          success: true,
          action: 'conflict',
          message: `检测到 ${conflictIds.length} 个冲突配置，请选择保留哪个版本`,
          remoteData: remoteConfigs,
          localData: localConfigs,
        };
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      return {
        success: false,
        action: 'skip',
        message: `同步失败: ${error.message || '未知错误'}`,
      };
    }
  }

  async resolveConflict(
    choice: 'server' | 'local',
    remoteConfigs: LLMConfig[],
    localConfigs: LLMConfig[]
  ): Promise<SyncResult> {
    try {
      if (choice === 'server') {
        return {
          success: true,
          action: 'download',
          message: '已使用服务器版本',
          localData: remoteConfigs,
        };
      } else {
        await this.uploadConfig(localConfigs);
        return {
          success: true,
          action: 'upload',
          message: '已使用本地版本',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'skip',
        message: `冲突解决失败: ${error.message || '未知错误'}`,
      };
    }
  }
}
