import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriesTab } from './catalog/CategoriesTab';
import { PrioritiesTab } from './catalog/PrioritiesTab';
import { SectorsTab } from './catalog/SectorsTab';
import { StatusesTab } from './catalog/StatusesTab';
import { UsersTab } from './users/UsersTab';

interface AdminTab {
  value: string;
  label: string;
  content: () => ReactNode;
}

const ADMIN_TABS: readonly AdminTab[] = [
  { value: 'users', label: 'Usuários', content: () => <UsersTab /> },
  { value: 'sectors', label: 'Setores', content: () => <SectorsTab /> },
  { value: 'categories', label: 'Categorias', content: () => <CategoriesTab /> },
  { value: 'statuses', label: 'Status', content: () => <StatusesTab /> },
  { value: 'priorities', label: 'Prioridades', content: () => <PrioritiesTab /> },
];

/** Tela 8: administration of users and catalogs, tabs navigable with the arrow keys (BR7.1). */
export function AdminPage() {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl font-semibold">Administração</h1>
      <Tabs defaultValue="users" className="min-w-0">
        <div className="max-w-full overflow-x-auto">
          <TabsList aria-label="Seções da administração">
            {ADMIN_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                data-testid={`admin-tabs-${tab.value}-tab`}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {ADMIN_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="min-w-0 pt-2">
            {tab.content()}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
