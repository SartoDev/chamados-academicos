import { Route, Routes } from 'react-router';
import { AdminPage } from '@/features/admin/AdminPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AllTicketsPage } from '@/features/tickets/AllTicketsPage';
import { MyTicketsPage } from '@/features/tickets/MyTicketsPage';
import { NewTicketPage } from '@/features/tickets/NewTicketPage';
import { SectorQueuePage } from '@/features/tickets/SectorQueuePage';
import { TicketDetailPage } from '@/features/tickets/TicketDetailPage';
import { ProtectedLayout } from './ProtectedLayout';
import { EntryRedirect, NotFoundPage } from './StatusPages';

/** Routes of U1, U2 and U4. The real protection is on the API; here it shapes the navigation. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<EntryRedirect />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="/tickets" element={<ProtectedLayout allowedRoles={['STUDENT', 'PROFESSOR']} />}>
        <Route index element={<MyTicketsPage />} />
        <Route path="new" element={<NewTicketPage />} />
      </Route>
      <Route path="/queue" element={<ProtectedLayout allowedRoles={['AGENT', 'MANAGER']} />}>
        <Route index element={<SectorQueuePage />} />
      </Route>
      <Route path="/all-tickets" element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
        <Route index element={<AllTicketsPage />} />
      </Route>
      <Route path="/reports" element={<ProtectedLayout allowedRoles={['MANAGER', 'ADMIN']} />}>
        <Route index element={<ReportsPage />} />
      </Route>
      <Route path="/admin" element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
        <Route index element={<AdminPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
