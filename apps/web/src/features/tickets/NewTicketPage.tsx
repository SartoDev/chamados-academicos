import { Link } from 'react-router';
import { NewTicketForm } from './NewTicketForm';

/** Tela 4: one page with every field visible (wireframes, Q3). */
export function NewTicketPage() {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link
          to="/tickets"
          className="w-fit text-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          data-testid="new-ticket-back-link"
        >
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Novo Chamado</h1>
      </div>
      <NewTicketForm />
    </section>
  );
}
