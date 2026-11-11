import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import type { NavItem } from '../navigation';

interface SideNavProps {
  items: readonly NavItem[];
  /** Called after choosing an item, e.g. to close the mobile menu. */
  onNavigate?: () => void;
}

/** Navigation by role; the active item is marked by aria-current, weight and a side bar (BR7.1). */
export function SideNav({ items, onNavigate }: SideNavProps) {
  return (
    <nav aria-label="Navegação principal" data-testid="side-nav">
      {items.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">Nenhuma seção disponível.</p>
      ) : (
        <ul className="flex flex-col gap-1 p-2">
          {items.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                data-testid={`side-nav-link-${item.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-md border-l-4 px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    isActive
                      ? 'border-primary bg-muted font-semibold'
                      : 'border-transparent hover:bg-muted',
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
