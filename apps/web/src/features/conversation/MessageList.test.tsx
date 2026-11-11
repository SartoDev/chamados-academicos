import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Message } from '@/app/api/types';
import type { ListStatus } from '@/app/components/list-status';
import { makeAgentMessage, makeConversation, makeMessage } from '@/test/message-fixtures';
import { makeTicketInAnalysis } from '@/test/ticket-fixtures';
import { MessageList } from './MessageList';

const ticket = makeTicketInAnalysis();

interface ListOptions {
  messages?: Message[];
  status?: ListStatus;
  hasPrevious?: boolean;
  loadingPrevious?: boolean;
  onRetry?: () => void;
  onLoadPrevious?: () => void;
}

function listElement(options: ListOptions) {
  const messages = options.messages ?? makeConversation(2);
  return (
    <MessageList
      messages={messages}
      ticket={ticket}
      status={options.status ?? (messages.length > 0 ? 'ready' : 'empty')}
      errorMessage="Não foi possível carregar a conversa."
      onRetry={options.onRetry ?? (() => {})}
      hasPrevious={options.hasPrevious ?? false}
      loadingPrevious={options.loadingPrevious ?? false}
      onLoadPrevious={options.onLoadPrevious ?? (() => {})}
    />
  );
}

/** The list needs no provider, so it is rendered bare and updated in place by `update`. */
function renderList(options: ListOptions = {}) {
  const user = userEvent.setup();
  const { rerender } = render(listElement(options));
  return {
    user,
    update: (next: ListOptions) => rerender(listElement({ ...options, ...next })),
  };
}

/** Gives the scroll container measurable dimensions, which jsdom does not compute. */
function makeScrollable(node: HTMLElement, scrollHeight: number, scrollTop: number) {
  let currentTop = scrollTop;
  Object.defineProperty(node, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  Object.defineProperty(node, 'scrollTop', {
    configurable: true,
    get: () => currentTop,
    set: (value: number) => {
      currentTop = value;
    },
  });
}

/** An older page, as "Carregar mensagens anteriores" brings it: earlier and never repeated. */
function olderPage(): Message[] {
  return makeConversation(2, Date.parse('2026-09-09T12:00:00.000Z')).map((message, index) => ({
    ...message,
    id: `older-${message.id}`,
    body: `Mensagem anterior ${index + 1}.`,
  }));
}

describe('MessageList and LoadPreviousButton (BR3.1, BR5.3, BR5.4, BR5.5)', () => {
  it('shows the bubbles in chronological order, each on the side of its author (BR5.1)', () => {
    renderList({ messages: [makeMessage(), makeAgentMessage()] });

    const bubbles = screen.getAllByTestId('message-bubble');
    expect(bubbles).toHaveLength(2);
    expect(bubbles[0]).toHaveAttribute('data-side', 'requester');
    expect(bubbles[1]).toHaveAttribute('data-side', 'attendance');
    expect(within(bubbles[0]).getByTestId('message-bubble-body')).toHaveTextContent(
      'Bom dia, alguma novidade?',
    );
  });

  it('shows a skeleton while loading instead of an empty box (BR5.3)', () => {
    renderList({ messages: [], status: 'loading' });

    expect(screen.getByTestId('list-state-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('conversation-message-list')).not.toBeInTheDocument();
  });

  it('explains the empty conversation (BR5.3)', () => {
    renderList({ messages: [], status: 'empty' });

    expect(screen.getByTestId('list-state-empty')).toHaveTextContent(
      'Nenhuma mensagem ainda. Escreva a primeira.',
    );
  });

  it('offers a retry when the read failed (CT7)', async () => {
    const onRetry = vi.fn();
    const { user } = renderList({ messages: [], status: 'error', onRetry });

    expect(screen.getByTestId('list-state-error')).toHaveTextContent(
      'Não foi possível carregar a conversa.',
    );
    await user.click(screen.getByTestId('list-state-retry-button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('offers "Carregar mensagens anteriores" only while there are older ones (BR5.4)', async () => {
    const onLoadPrevious = vi.fn();
    const { user, update } = renderList({ hasPrevious: false, onLoadPrevious });
    expect(screen.queryByTestId('conversation-load-previous-button')).not.toBeInTheDocument();

    update({ hasPrevious: true });

    const button = screen.getByTestId('conversation-load-previous-button');
    expect(button).toHaveTextContent('Carregar mensagens anteriores');
    await user.click(button);
    expect(onLoadPrevious).toHaveBeenCalledTimes(1);
  });

  it('marks the load of older messages while it runs (BR5.4)', () => {
    renderList({ hasPrevious: true, loadingPrevious: true });

    const button = screen.getByTestId('conversation-load-previous-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Carregando...');
  });

  it('keeps the reading position when older messages are prepended (BR5.4)', async () => {
    const shown = makeConversation(2);
    const { user, update } = renderList({ messages: shown, hasPrevious: true });
    const scroll = screen.getByTestId('conversation-message-scroll');
    makeScrollable(scroll, 300, 100);

    await user.click(screen.getByTestId('conversation-load-previous-button'));
    // The older page arrives and the content above the reading point grows by 200 pixels.
    makeScrollable(scroll, 500, 0);
    update({ messages: [...olderPage(), ...shown], hasPrevious: false });

    // 500 (the new height) minus the 200 that separated the reader from the bottom.
    expect(scroll.scrollTop).toBe(300);
    expect(screen.getAllByTestId('message-bubble')).toHaveLength(4);
  });

  it('shows each joined message once, the older page above the current one (R-06)', () => {
    const shown = makeConversation(3);
    const { update } = renderList({ messages: shown, hasPrevious: true });

    // The join upstream already dropped the repeated identifiers; the list renders what it gets.
    update({ messages: [...olderPage(), ...shown] });

    const bodies = screen
      .getAllByTestId('message-bubble-body')
      .map((node) => node.textContent ?? '');
    expect(bodies).toEqual([
      'Mensagem anterior 1.',
      'Mensagem anterior 2.',
      'Mensagem 1.',
      'Mensagem 2.',
      'Mensagem 3.',
    ]);
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  it('announces messages that arrived, and never the first load (BR5.5, BR5.6)', () => {
    const shown = makeConversation(1);
    const { update } = renderList({ messages: shown });
    expect(screen.getByTestId('conversation-announcer')).toHaveTextContent('');

    update({ messages: [...shown, makeAgentMessage()] });

    expect(screen.getByTestId('conversation-announcer')).toHaveTextContent('1 nova mensagem.');
  });

  it('does not announce the older messages a previous page brought in (BR5.5)', () => {
    const shown = makeConversation(2);
    const { update } = renderList({ messages: shown, hasPrevious: true });

    update({ messages: [...olderPage(), ...shown], hasPrevious: false });

    expect(screen.getByTestId('conversation-announcer')).toHaveTextContent('');
    expect(screen.getAllByTestId('message-bubble')).toHaveLength(4);
  });
});
