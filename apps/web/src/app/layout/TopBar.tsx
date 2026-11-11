import { CircleUser, Menu } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import type { CurrentUser } from '../api/types';
import { entryPathForRole, type NavItem } from '../navigation';
import { ROLE_LABELS } from '../roles';
import { SideNav } from './SideNav';

interface TopBarProps {
  user: CurrentUser;
  items: readonly NavItem[];
  onSignOut: () => void;
}

/** Banner with the logo, the notification bell (filled by U2) and the account menu. */
export function TopBar({ user, items, onSignOut }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-3 md:px-4">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu de navegação"
            data-testid="top-bar-menu-button"
          >
            <Menu aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0" data-testid="top-bar-mobile-menu">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Seções disponíveis para o seu perfil.</SheetDescription>
          </SheetHeader>
          <SideNav items={items} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <Link
        to={entryPathForRole(user.role)}
        className="rounded-md px-1 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        data-testid="top-bar-home-link"
      >
        Chamados Acadêmicos
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label={`Menu da conta de ${user.name}`}
              data-testid="top-bar-account-menu-button"
            >
              <CircleUser aria-hidden />
              <span className="hidden max-w-40 truncate sm:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <span className="block">{user.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut} data-testid="top-bar-sign-out-item">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
