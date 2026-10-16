import { Outlet, Link, useLocation } from 'react-router-dom';
import { Languages, FileText, Settings } from 'lucide-react';
import { useLLMConfigStore } from '../../stores/llmConfigStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select-radix';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/translation', label: '翻译', icon: Languages },
  { path: '/file-translation', label: '文件翻译', icon: FileText },
  { path: '/settings', label: '设置', icon: Settings },
];

function Layout() {
  const location = useLocation();
  // 订阅派生值本身，store 变更才会触发重渲染（原来订阅 s.getActiveConfig 返回函数引用恒定）
  const activeConfig = useLLMConfigStore((s) =>
    s.configs.find((cfg) => cfg.id === s.activeConfigId)
  );
  const configs = useLLMConfigStore((s) => s.configs);
  const activeConfigId = useLLMConfigStore((s) => s.activeConfigId);
  const setActiveConfig = useLLMConfigStore((s) => s.setActiveConfig);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-[1240px] items-center gap-6 px-6">
          <Link to="/translation" className="flex items-center gap-2.5 no-underline">
            <img src="/logo.svg" alt="" className="size-[26px]" />
            <span className="font-brand text-[20px] leading-none text-ink">
              Translation <span className="italic text-accent-strong">Agent</span>
            </span>
          </Link>

          {/* 激活态不再只靠颜色区分（原 text-muted 3.26:1 且不直观）：
              aria-current + 图标变色 + 下标条三重编码 */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-2 rounded-lg px-3 py-2 text-[14.5px] font-medium no-underline transition-colors',
                    active ? 'text-ink' : 'text-muted hover:text-ink hover:bg-accent/5'
                  )}
                >
                  <Icon
                    className={cn('size-[15px]', active ? 'text-accent' : 'opacity-60')}
                  />
                  {item.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-accent"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 全局模型状态 + 使用中模型切换：
              没有配置时保留原来的「未配置模型 / 去设置」入口；
              有多个配置时直接在这里切换，不必再进设置页。 */}
          <div className="ml-auto">
            {configs.length === 0 ? (
              <Link
                to="/settings"
                className="flex h-7 items-center gap-2 rounded-full border border-danger/35 bg-danger/5 px-2.5 text-xs text-danger no-underline transition-colors hover:border-danger"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-danger" />
                <span className="font-mono">未配置模型</span>
                <span className="font-medium">去设置</span>
              </Link>
            ) : (
              <Select
                value={activeConfigId ?? undefined}
                onValueChange={setActiveConfig}
              >
                <SelectTrigger
                  aria-label="切换使用中的模型"
                  className={cn(
                    'h-7 w-auto gap-2 rounded-full border-border bg-surface px-2.5 py-0 text-xs',
                    'text-muted focus:border-accent focus:ring-0',
                    // Radix 把 ChevronDown 放在 children 之后，缩小默认间距
                    '[&>span]:flex [&>span]:items-center [&>span]:gap-2'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      activeConfig ? 'bg-success' : 'bg-danger'
                    )}
                  />
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                  {configs.map((cfg) => (
                    <SelectItem key={cfg.id} value={cfg.id} className="font-mono">
                      {cfg.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1240px] px-6 py-9">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
