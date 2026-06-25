import { useEffect, useRef, useCallback } from 'react';
import { useWebDAVStore } from '../stores/webdavStore';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { WebDAVService } from '../services/webdav/WebDAVService';
import { toast } from 'sonner';

export function useWebDAVSync() {
  const { config, isSyncing, setIsSyncing, setSyncResult, updateLastSyncAt } = useWebDAVStore();
  const { configs, addConfig, updateConfig, deleteConfig } = useLLMConfigStore();
  const webdavServiceRef = useRef<WebDAVService | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  // 初始化 WebDAV 服务
  useEffect(() => {
    if (config) {
      webdavServiceRef.current = new WebDAVService(config);
    } else {
      webdavServiceRef.current = null;
    }
  }, [config]);

  // 执行同步
  const performSync = useCallback(async (showToast = true) => {
    if (!config || !webdavServiceRef.current || isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      const result = await webdavServiceRef.current.sync(configs, config.lastSyncAt);

      if (result.success) {
        if (result.action === 'download' || (result.action === 'upload' && result.localData)) {
          // 需要更新本地配置
          if (result.localData) {
            // 清空现有配置，重新添加
            configs.forEach(c => deleteConfig(c.id));
            result.localData.forEach(c => {
              addConfig(c);
            });
          }
        }

        if (result.action === 'conflict') {
          // 冲突需要用户处理，返回冲突数据
          setSyncResult('error', result.message);
          if (showToast) {
            toast.error(result.message);
          }
          return { needsConflictResolution: true, result };
        }

        setSyncResult('success', result.message);
        updateLastSyncAt();
        
        if (showToast && result.action !== 'skip') {
          toast.success(result.message);
        }
      } else {
        setSyncResult('error', result.message);
        if (showToast) {
          toast.error(result.message);
        }
      }

      return { needsConflictResolution: false, result };
    } catch (error: any) {
      const message = `同步失败: ${error.message || '未知错误'}`;
      setSyncResult('error', message);
      if (showToast) {
        toast.error(message);
      }
      return { needsConflictResolution: false, result: null };
    } finally {
      setIsSyncing(false);
    }
  }, [config, configs, isSyncing, setIsSyncing, setSyncResult, updateLastSyncAt, addConfig, updateConfig, deleteConfig]);

  // 定时同步
  useEffect(() => {
    if (config?.autoSync && config.syncInterval > 0) {
      // 清除旧定时器
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }

      // 启动时同步一次
      performSync(false);

      // 设置定时器
      syncTimerRef.current = window.setInterval(() => {
        performSync(false);
      }, config.syncInterval * 60 * 1000); // 转换为毫秒

      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
        }
      };
    } else {
      // 清除定时器
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    }
  }, [config?.autoSync, config?.syncInterval, performSync]);

  return {
    performSync,
    isSyncing,
  };
}
