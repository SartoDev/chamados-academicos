import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/use-session';
import { cn } from '@/lib/utils';
import { navItemsFor } from '../navigation';
import { SideNav } from './SideNav';
import { SkipToContentLink } from './SkipToContentLink';
import { TopBar } from './TopBar';

/**
 * Shared shell: skip link, banner, navigation and main content regions (BR7.1). The sidebar
 * collapses on desktop and becomes a menu below 768px (BR7.2).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return null;
  }
  const items = navItemsFor(user.role);
  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SkipToContentLink />
      <TopBar user={user} items={items} onSignOut={() => void handleSignOut()} />
      <div className="flex">
        <aside
          className={cn(
            'hidden shrink-0 border-r md:flex md:min-h-[calc(100vh-3.5rem)] md:flex-col',
            collapsed ? 'md:w-14' : 'md:w-60',
          )}
          data-testid="app-shell-sidebar"
        >
          {!collapsed && <SideNav items={items} />}
          <Button
            variant="ghost"
            size="sm"
            className="m-2 mt-auto justify-start"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
            data-testid="app-shell-collapse-button"
          >
            {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
            <span className={cn(collapsed && 'sr-only')}>
              {collapsed ? 'Expandir menu' : 'Recolher menu'}
            </span>
          </Button>
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
