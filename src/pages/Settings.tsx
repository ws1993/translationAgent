import { useState, useEffect } from 'react';
import { useLLMConfigStore } from '../stores/llmConfigStore';
import { useWebDAVStore } from '../stores/webdavStore';
import { LLMService } from '../services/llm/LLMService';
import { WebDAVService } from '../services/webdav/WebDAVService';
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
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { WebDAVSettings } from '../components/webdav/WebDAVSettings';

function Settings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  
  const [llmForm, setLLMForm] = useState({
    name: '',
    provider: 'openai' as 'openai' | 'anthropic' | 'custom',
    apiKey: '',
    baseUrl: '',
    model: '',
    temperature: 0,
    topP: 1,
    maxTokens: 2000,
  });
  const [testingLLM, setTestingLLM] = useState(false);
  const [llmTestResult, setLLMTestResult] = useState<string | null>(null);

  const { configs, addConfig, updateConfig, setActiveConfig, activeConfigId, deleteConfig } = useLLMConfigStore();

  const resetForm = () => {
    setLLMForm({
      name: '',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: '',
      temperature: 0,
      topP: 1,
      maxTokens: 2000,
    });
    setEditingConfigId(null);
    setLLMTestResult(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (config: LLMConfig) => {
    setLLMForm({
      name: config.name,
      provider: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || '',
      model: config.model,
      temperature: config.temperature || 0,
      topP: config.topP || 1,
      maxTokens: config.maxTokens || 2000,
    });
    setEditingConfigId(config.id);
    setDialogOpen(true);
  };

  const handleSaveLLMConfig = () => {
    if (!llmForm.name || !llmForm.apiKey || !llmForm.model) {
      toast.error('请填写必填项');
      return;
    }

    if (editingConfigId) {
      updateConfig(editingConfigId, {
        name: llmForm.name,
        provider: llmForm.provider,
        apiKey: llmForm.apiKey,
        baseUrl: llmForm.baseUrl || undefined,
        model: llmForm.model,
        temperature: llmForm.temperature,
        topP: llmForm.topP,
        maxTokens: llmForm.maxTokens,
      });
      toast.success('配置已更新');
    } else {
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
    }

    setDialogOpen(false);
    resetForm();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-semibold text-ink mb-2">
            设置
          </h2>
          <p className="text-muted">配置大模型</p>
        </div>
        <Button onClick={handleOpenAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          新增配置
        </Button>
      </div>

      {/* 已保存的配置列表 */}
      {configs.length > 0 ? (
        <div className="space-y-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                config.id === activeConfigId
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setActiveConfig(config.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="font-medium text-ink">{config.name}</div>
                  {config.id === activeConfigId && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-white">
                      使用中
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted mt-1">
                  {config.provider} · {config.model}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditDialog(config);
                  }}
                  title="编辑"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConfig(config.id);
                  }}
                  title="删除"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted mb-4">暂无配置的大模型</p>
          <Button onClick={handleOpenAddDialog} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            添加第一个配置
          </Button>
        </Card>
      )}

      {/* 新增/编辑配置的 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingConfigId ? '编辑模型配置' : '新增模型配置'}
          </DialogTitle>
          <DialogDescription>
            {editingConfigId ? '修改大模型的连接配置' : '添加一个新的大模型连接配置'}
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <div className="flex gap-3 w-full">
            <Button
              onClick={handleTestLLM}
              disabled={testingLLM}
              variant="outline"
              className="flex-1"
            >
              {testingLLM ? '测试中...' : '测试连接'}
            </Button>
            <Button onClick={handleSaveLLMConfig} className="flex-1">
              {editingConfigId ? '保存修改' : '保存配置'}
            </Button>
          </div>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default Settings;
