import { useState, useEffect } from 'react';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { useWebDAVStore } from '../stores/webdavStore';
import { LLMService } from '../services/llm/LLMService';
import { LLMConfig } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select-radix';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

function Settings() {
  const [activeTab, setActiveTab] = useState<'llm' | 'webdav'>('llm');
  
  const [llmForm, setLLMForm] = useState({
    name: '',
    provider: 'openai' as 'openai' | 'anthropic' | 'custom',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4',
    temperature: 0,
    topP: 1,
    maxTokens: 2000,
  });
  const [testingLLM, setTestingLLM] = useState(false);
  const [llmTestResult, setLLMTestResult] = useState<string | null>(null);

  const [webdavForm, setWebdavForm] = useState({
    url: '',
    username: '',
    password: '',
    autoSync: false,
    syncInterval: 15,
    conflictStrategy: 'prompt' as 'server' | 'local' | 'prompt',
  });

  const { configs, addConfig, setActiveConfig, activeConfigId, deleteConfig } = useLLMConfigStore();
  const { config: webdavConfig, setConfig: setWebdavConfig } = useWebDAVStore();

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
    }
  }, [webdavConfig]);

  const handleSaveLLMConfig = () => {
    if (!llmForm.name || !llmForm.apiKey || !llmForm.model) {
      toast.error('请填写必填项');
      return;
    }

    addConfig({
      name: llmForm.name,
      provider: llmForm.provider,
      apiKey: llmForm.apiKey,
      baseUrl: llmForm.baseUrl || undefined,
      model: llmForm.model,
      temperature: llmForm.temperature,
      topP: llmForm.topP,
      maxTokens: llmForm.maxTokens,
      isActive: false,
    });

    toast.success('配置已保存');
    setLLMForm({
      name: '',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4',
      temperature: 0,
      topP: 1,
      maxTokens: 2000,
    });
  };

  const handleTestLLM = async () => {
    if (!llmForm.apiKey || !llmForm.model) {
      toast.error('请先填写 API Key 和模型');
      return;
    }

    setTestingLLM(true);
    setLLMTestResult(null);

    try {
      const testConfig: LLMConfig = {
        id: 'test',
        name: 'test',
        provider: llmForm.provider,
        apiKey: llmForm.apiKey,
        baseUrl: llmForm.baseUrl || undefined,
        model: llmForm.model,
        temperature: llmForm.temperature,
        topP: llmForm.topP,
        maxTokens: llmForm.maxTokens,
        isActive: false,
      };

      const llmService = new LLMService(testConfig);
      const success = await llmService.testConnection();

      setLLMTestResult(success ? 'success' : 'error');
      if (success) {
        toast.success('连接成功');
      } else {
        toast.error('连接失败');
      }
    } catch (error: any) {
      setLLMTestResult('error');
      toast.error('连接失败');
      console.error('Test failed:', error);
    } finally {
      setTestingLLM(false);
    }
  };

  const handleSaveWebDAV = () => {
    if (!webdavForm.url || !webdavForm.username || !webdavForm.password) {
      toast.error('请填写所有字段');
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

  const handleDeleteConfig = (configId: string) => {
    toast(
      '确定删除此配置吗？',
      {
        description: '删除后无法恢复',
        action: {
          label: '删除',
          onClick: () => {
            deleteConfig(configId);
            toast.success('配置已删除');
          },
        },
        cancel: {
          label: '取消',
          onClick: () => {},
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-semibold text-ink mb-2">
          设置
        </h2>
        <p className="text-muted">配置大模型和同步服务</p>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('llm')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'llm'
              ? 'text-accent border-b-2 border-accent'
              : 'text-muted hover:text-ink'
          }`}
        >
          大模型配置
        </button>
        <button
          onClick={() => setActiveTab('webdav')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'webdav'
              ? 'text-accent border-b-2 border-accent'
              : 'text-muted hover:text-ink'
          }`}
        >
          WebDAV 同步
        </button>
      </div>

      {activeTab === 'llm' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-serif font-medium text-ink mb-4">
              新增大模型配置
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">配置名称 *</Label>
                <Input
                  type="text"
                  value={llmForm.name}
                  onChange={(e) => setLLMForm({ ...llmForm, name: e.target.value })}
                  placeholder="例如：OpenAI GPT-4"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">提供商 *</Label>
                <Select
                  value={llmForm.provider}
                  onValueChange={(value) => setLLMForm({ ...llmForm, provider: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">API Key *</Label>
                <Input
                  type="password"
                  value={llmForm.apiKey}
                  onChange={(e) => setLLMForm({ ...llmForm, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>
              
              <div>
                <Label className="mb-2 block">Base URL（可选）</Label>
                <Input
                  type="url"
                  value={llmForm.baseUrl}
                  onChange={(e) => setLLMForm({ ...llmForm, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">模型 *</Label>
                <Input
                  type="text"
                  value={llmForm.model}
                  onChange={(e) => setLLMForm({ ...llmForm, model: e.target.value })}
                  placeholder="gpt-4"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block">Temperature</Label>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={llmForm.temperature}
                    onChange={(e) => setLLMForm({ ...llmForm, temperature: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted mt-1">越低越确定，推荐 0</p>
                </div>
                <div>
                  <Label className="mb-2 block">Top P</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={llmForm.topP}
                    onChange={(e) => setLLMForm({ ...llmForm, topP: parseFloat(e.target.value) || 1 })}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted mt-1">配合 temperature=0 使用，推荐 1</p>
                </div>
                <div>
                  <Label className="mb-2 block">最大 Tokens</Label>
                  <Input
                    type="number"
                    min="100"
                    max="128000"
                    step="100"
                    value={llmForm.maxTokens}
                    onChange={(e) => setLLMForm({ ...llmForm, maxTokens: parseInt(e.target.value) || 2000 })}
                    placeholder="2000"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={handleTestLLM}
                  disabled={testingLLM}
                  variant="outline"
                >
                  {testingLLM ? '测试中...' : '测试连接'}
                </Button>
                <Button onClick={handleSaveLLMConfig}>
                  保存配置
                </Button>
              </div>
              
              {llmTestResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    llmTestResult === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {llmTestResult === 'success' ? '✓ 连接成功' : '✗ 连接失败'}
                </div>
              )}
            </div>
          </Card>

          {configs.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-serif font-medium text-ink mb-4">
                已保存的配置
              </h3>
              <div className="space-y-2">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      config.id === activeConfigId
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    }`}
                    onClick={() => setActiveConfig(config.id)}
                  >
                    <div>
                      <div className="font-medium text-ink">{config.name}</div>
                      <div className="text-sm text-muted">
                        {config.provider} · {config.model}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.id === activeConfigId && (
                        <span className="text-xs bg-accent text-white px-2 py-1 rounded">
                          使用中
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConfig(config.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'webdav' && (
        <Card className="p-6">
          <h3 className="text-xl font-serif font-medium text-ink mb-4">
            WebDAV 同步配置
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">服务器地址</Label>
              <Input
                type="url"
                value={webdavForm.url}
                onChange={(e) => setWebdavForm({ ...webdavForm, url: e.target.value })}
                placeholder="https://dav.example.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">用户名</Label>
                <Input
                  type="text"
                  value={webdavForm.username}
                  onChange={(e) => setWebdavForm({ ...webdavForm, username: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2 block">密码</Label>
                <Input
                  type="password"
                  value={webdavForm.password}
                  onChange={(e) => setWebdavForm({ ...webdavForm, password: e.target.value })}
                />
              </div>
            </div>
            
            <Button onClick={handleSaveWebDAV}>
              保存配置
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default Settings;
