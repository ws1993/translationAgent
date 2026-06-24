import { Outlet, Link, useLocation } from 'react-router-dom';

function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/translation', label: '翻译' },
    { path: '/domains', label: '领域管理' },
    { path: '/settings', label: '设置' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-surface-1/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1440px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-semibold text-ink tracking-tight">
              Translation <span className="text-accent italic">Agent</span>
            </h1>
            <div className="flex gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-[0.95rem] font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-ink'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-[1440px] mx-auto px-8 py-12">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
