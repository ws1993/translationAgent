import { useState, useEffect, useRef } from 'react';
import { useWebDAVStore } from '../../stores/webdavStore';
import { useLLMConfigStore } from '../../stores/llmConfigStore';
import { WebDAVService } from '../../services/webdav/WebDAVService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select-radix';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Cloud } from 'lucide-react';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { SyncResult } from '../../services/webdav/WebDAVService';

export function WebDAVSettings() {
  const { 
    config: webdavConfig, 
    setConfig: setWebdavConfig,
    isSyncing,
    setIsSyncing,
    setSyncResult,
    updateLastSyncAt,
    lastSyncStatus,
    lastSyncMessage,
    lastSyncAt,
  } = useWebDAVStore();
  
  const { configs, addConfig, deleteConfig } = useLLMConfigStore();

  const [webdavForm, setWebdavForm] = useState({
    url: '',
    username: '',
    password: '',
    autoSync: false,
    syncInterval: 15,
    conflictStrategy: 'prompt' as 'server' | 'local' | 'prompt',
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{ remoteConfigs: any[]; localConfigs: any[] } | null>(null);
  
  const webdavServiceRef = useRef<WebDAVService | null>(null);

  useEffect(() => {
    if (webdavConfig) {
      setWebdavForm({
        url: webdavConfig.url,
        username: webdavConfig.username,
        password: webdavConfig.password,
        autoSync: webdavConfig.autoSync,
        syncInterval: webdavConfig.syncInterval,
        conflictStrategy: webdavConfig.conflictStrategy,
      });
      webdavServiceRef.current = new WebDAVService(webdavConfig);
    }
  }, [webdavConfig]);

  const handleSaveWebDAV = () => {
    if (!webdavForm.url || !webdavForm.username || !webdavForm.password) {
      toast.error('请填写所有必填字段');
      return;
    }

    setWebdavConfig({
      url: webdavForm.url,
      username: webdavForm.username,
      password: webdavForm.password,
      autoSync: webdavForm.autoSync,
      syncInterval: webdavForm.syncInterval,
      conflictStrategy: webdavForm.conflictStrategy,
    });

    toast.success('WebDAV 配置已保存');
  };

  const handleTestConnection = async () => {
    if (!webdavForm.url || !webdavForm.username || !webdavForm.password) {
      toast.error('请先填写完整配置');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const tempService = new WebDAVService({
        url: webdavForm.url,
        username: webdavForm.username,
        password: webdavForm.password,
        autoSync: webdavForm.autoSync,
        syncInterval: webdavForm.syncInterval,
        conflictStrategy: webdavForm.conflictStrategy,
      });

      const result = await tempService.testConnection();
      setTestResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      const message = `测试失败: ${error.message || '未知错误'}`;
      setTestResult({ success: false, message });
      toast.error(message);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleManualSync = async () => {
    if (!webdavConfig || !webdavServiceRef.current) {
      toast.error('请先保存 WebDAV 配置');
      return;
    }

    setIsSyncing(true);

    try {
      const result = await webdavServiceRef.current.sync(configs, webdavConfig.lastSyncAt);

      if (result.success) {
        if (result.action === 'conflict') {
          setConflictData({
            remoteConfigs: result.remoteData || [],
            localConfigs: result.localData || [],
          });
          setConflictModalOpen(true);
          setSyncResult('error', result.message);
        } else {
          if (result.action === 'download' || (result.action === 'upload' && result.localData)) {
            if (result.localData) {
              configs.forEach(c => deleteConfig(c.id));
              result.localData.forEach(c => addConfig(c));
            }
          }

          setSyncResult('success', result.message);
          updateLastSyncAt();
          
          if (result.action !== 'skip') {
            toast.success(result.message);
          } else {
            toast.info(result.message);
          }
        }
      } else {
        setSyncResult('error', result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      const message = `同步失败: ${error.message || '未知错误'}`;
      setSyncResult('error', message);
      toast.error(message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConflictResolve = async (choice: 'server' | 'local') => {
    if (!conflictData || !webdavServiceRef.current) return;

    setIsSyncing(true);

    try {
      const result = await webdavServiceRef.current.resolveConflict(
        choice,
        conflictData.remoteConfigs,
        conflictData.localConfigs
      );

      if (result.success) {
        if (result.localData) {
          configs.forEach(c => deleteConfig(c.id));
          result.localData.forEach(c => addConfig(c));
        }

        setSyncResult('success', result.message);
        updateLastSyncAt();
        toast.success(result.message);
      } else {
        setSyncResult('error', result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      const message = `冲突解决失败: ${error.message || '未知错误'}`;
      setSyncResult('error', message);
      toast.error(message);
    } finally {
      setIsSyncing(false);
      setConflictModalOpen(false);
      setConflictData(null);
    }
  };

  const formatSyncTime = (isoString: string | null) => {
    if (!isoString) return '从未同步';
    
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} 小时前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} 天前`;
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-xl font-serif font-medium text-ink mb-4">
            WebDAV 服务器配置
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">服务器地址 *</Label>
              <Input
                type="url"
                value={webdavForm.url}
                onChange={(e) => setWebdavForm({ ...webdavForm, url: e.target.value })}
                placeholder="https://dav.example.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">用户名 *</Label>
                <Input
                  type="text"
                  value={webdavForm.username}
                  onChange={(e) => setWebdavForm({ ...webdavForm, username: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div>
                <Label className="mb-2 block">密码 *</Label>
                <Input
                  type="password"
                  value={webdavForm.password}
                  onChange={(e) => setWebdavForm({ ...webdavForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleTestConnection}
                disabled={testingConnection}
                variant="outline"
              >
                {testingConnection ? '测试中...' : '测试连接'}
              </Button>
              <Button onClick={handleSaveWebDAV}>
                保存配置
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-serif font-medium text-ink mb-4">
            同步设置
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>自动同步</Label>
                <p className="text-sm text-muted mt-1">启动时和定时自动同步配置</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={webdavForm.autoSync}
                  onChange={(e) => setWebdavForm({ ...webdavForm, autoSync: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            <div>
              <Label className="mb-2 block">同步间隔（分钟）</Label>
              <Input
                type="number"
                min="1"
                max="1440"
                value={webdavForm.syncInterval}
                onChange={(e) => setWebdavForm({ ...webdavForm, syncInterval: parseInt(e.target.value) || 15 })}
                disabled={!webdavForm.autoSync}
              />
              <p className="text-xs text-muted mt-1">自动同步时的间隔时间</p>
            </div>

            <div>
              <Label className="mb-2 block">冲突处理策略</Label>
              <Select
                value={webdavForm.conflictStrategy}
                onValueChange={(value) => setWebdavForm({ ...webdavForm, conflictStrategy: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prompt">提示我选择</SelectItem>
                  <SelectItem value="server">优先使用服务器版本</SelectItem>
                  <SelectItem value="local">优先使用本地版本</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted mt-1">检测到冲突时的处理方式</p>
            </div>
          </div>
        </Card>

        {webdavConfig && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-medium text-ink">
                同步状态
              </h3>
              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? '同步中...' : '立即同步'}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-muted" />
                  <div>
                    <div className="text-sm font-medium text-ink">上次同步</div>
                    <div className="text-xs text-muted">{formatSyncTime(lastSyncAt)}</div>
                  </div>
                </div>
                {lastSyncStatus && (
                  <div className="flex items-center gap-2">
                    {lastSyncStatus === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>

              {lastSyncMessage && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    lastSyncStatus === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {lastSyncMessage}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {conflictData && (
        <ConflictResolutionModal
          isOpen={conflictModalOpen}
          onClose={() => {
            setConflictModalOpen(false);
            setConflictData(null);
          }}
          remoteConfigs={conflictData.remoteConfigs}
          localConfigs={conflictData.localConfigs}
          onResolve={handleConflictResolve}
        />
      )}
    </>
  );
}
