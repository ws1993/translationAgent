import { useState, useEffect } from 'react';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { useWebDAVStore } from '../stores/webdavStore';
import { LLMService } from '../services/llm/LLMService';
import { LLMConfig } from '../types';

function Settings() {
  const [activeTab, setActiveTab] = useState<'llm' | 'webdav'>('llm');
  
  const [llmForm, setLLMForm] = useState({
    name: '',
    provider: 'openai' as 'openai' | 'anthropic' | 'custom',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4',
    temperature: 0.7,
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

  const { configs, addConfig, setActiveConfig, activeConfigId } = useLLMConfigStore();
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
      alert('请填写必填项');
      return;
    }

    addConfig({
      name: llmForm.name,
      provider: llmForm.provider,
      apiKey: llmForm.apiKey,
      baseUrl: llmForm.baseUrl || undefined,
      model: llmForm.model,
      temperature: llmForm.temperature,
      maxTokens: llmForm.maxTokens,
      isActive: false,
    });

    alert('配置已保存');
    setLLMForm({
      name: '',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
    });
  };

  const handleTestLLM = async () => {
    if (!llmForm.apiKey || !llmForm.model) {
      alert('请先填写 API Key 和模型');
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
        maxTokens: llmForm.maxTokens,
        isActive: false,
      };

      const llmService = new LLMService(testConfig);
      const success = await llmService.testConnection();

      setLLMTestResult(success ? 'success' : 'error');
    } catch (error: any) {
      setLLMTestResult('error');
      console.error('Test failed:', error);
    } finally {
      setTestingLLM(false);
    }
  };

  const handleSaveWebDAV = () => {
    if (!webdavForm.url || !webdavForm.username || !webdavForm.password) {
      alert('请填写所有字段');
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

    alert('WebDAV 配置已保存');
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
          <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
            <h3 className="text-xl font-serif font-medium text-ink mb-4">
              新增大模型配置
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  配置名称 *
                </label>
                <input
                  type="text"
                  value={llmForm.name}
                  onChange={(e) => setLLMForm({ ...llmForm, name: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="例如：OpenAI GPT-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  提供商 *
                </label>
                <select
                  value={llmForm.provider}
                  onChange={(e) => setLLMForm({ ...llmForm, provider: e.target.value as any })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  value={llmForm.apiKey}
                  onChange={(e) => setLLMForm({ ...llmForm, apiKey: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Base URL（可选）
                </label>
                <input
                  type="url"
                  value={llmForm.baseUrl}
                  onChange={(e) => setLLMForm({ ...llmForm, baseUrl: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  模型 *
                </label>
                <input
                  type="text"
                  value={llmForm.model}
                  onChange={(e) => setLLMForm({ ...llmForm, model: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="gpt-4"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleTestLLM}
                  disabled={testingLLM}
                  className="px-4 py-2 border border-accent text-accent rounded hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                >
                  {testingLLM ? '测试中...' : '测试连接'}
                </button>
                <button
                  onClick={handleSaveLLMConfig}
                  className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
                >
                  保存配置
                </button>
              </div>
              {llmTestResult && (
                <div
                  className={`p-3 rounded text-sm ${
                    llmTestResult === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {llmTestResult === 'success' ? '✓ 连接成功' : '✗ 连接失败'}
                </div>
              )}
            </div>
          </div>

          {configs.length > 0 && (
            <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
              <h3 className="text-xl font-serif font-medium text-ink mb-4">
                已保存的配置
              </h3>
              <div className="space-y-2">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
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
                    {config.id === activeConfigId && (
                      <span className="text-xs bg-accent text-white px-2 py-1 rounded">
                        使用中
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'webdav' && (
        <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
          <h3 className="text-xl font-serif font-medium text-ink mb-4">
            WebDAV 同步配置
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                服务器地址
              </label>
              <input
                type="url"
                value={webdavForm.url}
                onChange={(e) => setWebdavForm({ ...webdavForm, url: e.target.value })}
                className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="https://dav.example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={webdavForm.username}
                  onChange={(e) => setWebdavForm({ ...webdavForm, username: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={webdavForm.password}
                  onChange={(e) => setWebdavForm({ ...webdavForm, password: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSync"
                checked={webdavForm.autoSync}
                onChange={(e) => setWebdavForm({ ...webdavForm, autoSync: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="autoSync" className="text-sm text-ink">
                启用自动同步
              </label>
            </div>
            {webdavForm.autoSync && (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    同步周期（分钟）
                  </label>
                  <select
                    value={webdavForm.syncInterval}
                    onChange={(e) => setWebdavForm({ ...webdavForm, syncInterval: Number(e.target.value) })}
                    className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value={5}>5 分钟</option>
                    <option value={15}>15 分钟</option>
                    <option value={30}>30 分钟</option>
                    <option value={60}>1 小时</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    冲突处理策略
                  </label>
                  <select
                    value={webdavForm.conflictStrategy}
                    onChange={(e) => setWebdavForm({ ...webdavForm, conflictStrategy: e.target.value as any })}
                    className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="server">服务端优先</option>
                    <option value="local">本地优先</option>
                    <option value="prompt">提示用户</option>
                  </select>
                </div>
              </>
            )}
            <button
              onClick={handleSaveWebDAV}
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
            >
              保存配置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
