import { Outlet, Link, useLocation } from 'react-router-dom';
import { Languages, FileText, Settings } from 'lucide-react';
import { useLLMConfigStore } from '../../stores/llmConfigStore';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/translation', label: '翻译', icon: Languages },
  { path: '/file-translation', label: '文件翻译', icon: FileText },
  { path: '/settings', label: '设置', icon: Settings },
];

function Layout() {
  const location = useLocation();
  // 原来订阅 s.getActiveConfig 再手动调用：selector 返回函数引用恒定，
  // store 变更不会触发重渲染，保存配置后顶栏仍停留在「未配置模型」。
  const activeConfig = useLLMConfigStore((s) =>
    s.configs.find((cfg) => cfg.id === s.activeConfigId)
  );

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

          {/* 全局模型状态：避免「点了翻译才知道没配模型」 */}
          <div className="ml-auto">
            <Link
              to="/settings"
              className={cn(
                'flex h-7 items-center gap-2 rounded-full border px-2.5 text-xs no-underline transition-colors',
                activeConfig
                  ? 'border-border bg-surface text-muted hover:border-accent'
                  : 'border-danger/35 bg-danger/5 text-danger hover:border-danger'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'size-1.5 rounded-full',
                  activeConfig ? 'bg-success' : 'bg-danger'
                )}
              />
              <span className="font-mono">{activeConfig ? activeConfig.model : '未配置模型'}</span>
              {!activeConfig && <span className="font-medium">去设置</span>}
            </Link>
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
