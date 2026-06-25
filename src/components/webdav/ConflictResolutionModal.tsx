import { useState } from 'react';
import { LLMConfig } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { X } from 'lucide-react';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteConfigs: LLMConfig[];
  localConfigs: LLMConfig[];
  onResolve: (choice: 'server' | 'local') => void;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  remoteConfigs,
  localConfigs,
  onResolve,
}: ConflictResolutionModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<'server' | 'local' | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedChoice) {
      onResolve(selectedChoice);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-semibold text-ink">
            配置冲突
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-muted mb-6">
          检测到服务器配置与本地配置存在差异，请选择保留哪个版本。
        </p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedChoice === 'server'
                ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                : 'border-border hover:border-accent/50'
            }`}
            onClick={() => setSelectedChoice('server')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-serif font-medium text-ink">
                服务器版本
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  远程
                </span>
                {selectedChoice === 'server' && (
                  <span className="text-sm bg-accent text-white px-2 py-1 rounded">
                    已选择
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              {remoteConfigs.map((config) => (
                <div
                  key={config.id}
                  className="bg-surface border border-border rounded p-3"
                >
                  <div className="font-medium text-ink text-sm">{config.name}</div>
                  <div className="text-xs text-muted mt-1">
                    {config.provider} · {config.model}
                  </div>
                  {config.baseUrl && (
                    <div className="text-xs text-muted mt-1 truncate">
                      {config.baseUrl}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-muted mt-4">
              共 {remoteConfigs.length} 个配置
            </p>
          </div>

          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedChoice === 'local'
                ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                : 'border-border hover:border-accent/50'
            }`}
            onClick={() => setSelectedChoice('local')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-serif font-medium text-ink">
                本地版本
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                  本地
                </span>
                {selectedChoice === 'local' && (
                  <span className="text-sm bg-accent text-white px-2 py-1 rounded">
                    已选择
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              {localConfigs.map((config) => (
                <div
                  key={config.id}
                  className="bg-surface border border-border rounded p-3"
                >
                  <div className="font-medium text-ink text-sm">{config.name}</div>
                  <div className="text-xs text-muted mt-1">
                    {config.provider} · {config.model}
                  </div>
                  {config.baseUrl && (
                    <div className="text-xs text-muted mt-1 truncate">
                      {config.baseUrl}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-muted mt-4">
              共 {localConfigs.length} 个配置
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedChoice}
          >
            确认选择
          </Button>
        </div>
      </Card>
    </div>
  );
}
