import { useEffect, useRef } from 'react';
import { useWebDAVStore } from '../stores/webdavStore';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { WebDAVService } from '../services/webdav/WebDAVService';

export function useAutoSync() {
  const { config, setIsSyncing, setSyncResult, updateLastSyncAt } = useWebDAVStore();
  const { configs, addConfig, deleteConfig } = useLLMConfigStore();
  const webdavServiceRef = useRef<WebDAVService | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const hasInitialSyncRef = useRef(false);

  useEffect(() => {
    if (config) {
      webdavServiceRef.current = new WebDAVService(config);
    } else {
      webdavServiceRef.current = null;
    }
  }, [config]);

  useEffect(() => {
    const performSync = async () => {
      if (!config || !webdavServiceRef.current) return;

      setIsSyncing(true);

      try {
        const result = await webdavServiceRef.current.sync(configs, config.lastSyncAt);

        if (result.success && result.action !== 'conflict') {
          if (result.action === 'download' || (result.action === 'upload' && result.localData)) {
            if (result.localData) {
              configs.forEach(c => deleteConfig(c.id));
              result.localData.forEach(c => addConfig(c));
            }
          }
          setSyncResult('success', result.message);
          updateLastSyncAt();
        } else if (result.action === 'conflict') {
          setSyncResult('error', result.message);
        } else {
          setSyncResult('error', result.message);
        }
      } catch (error: any) {
        const message = `同步失败: ${error.message || '未知错误'}`;
        setSyncResult('error', message);
      } finally {
        setIsSyncing(false);
      }
    };

    if (config?.autoSync && config.syncInterval > 0) {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }

      if (!hasInitialSyncRef.current) {
        performSync();
        hasInitialSyncRef.current = true;
      }

      syncTimerRef.current = window.setInterval(() => {
        performSync();
      }, config.syncInterval * 60 * 1000);

      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
        }
      };
    } else {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      hasInitialSyncRef.current = false;
    }
  }, [config?.autoSync, config?.syncInterval]);

  return null;
}
