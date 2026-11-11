import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeAgentMessage, makeMessage } from '@/test/message-fixtures';
import { MessageBubble } from './MessageBubble';

const LONG_BODY = 'a'.repeat(500);
const MANY_LINES = Array.from({ length: 9 }, (_, index) => `Linha ${index + 1}`).join('\n');

describe('MessageBubble (Tela 5, BR3.3, BR5.1, BR5.4)', () => {
  it('writes the author and the instant, with the full date in the accessible title', () => {
    const message = makeMessage({
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
    render(<MessageBubble message={message} fromRequester />);

    expect(screen.getByText(message.author.name)).toBeInTheDocument();
    const when = screen.getByText('há 2 h');
    expect(when).toHaveAttribute('title', expect.stringContaining('/'));
  });

  it('keeps the name of an author who was deactivated (BR3.3, AC4.1.5)', () => {
    const message = makeMessage({
      author: { id: 'user-retired', name: 'Atendente Aposentada' },
    });
    render(<MessageBubble message={message} fromRequester={false} />);

    expect(screen.getByText('Atendente Aposentada')).toBeInTheDocument();
  });

  it('puts the requester on one side and the attendance on the other (BR5.1)', () => {
    const { unmount } = render(<MessageBubble message={makeMessage()} fromRequester />);
    expect(screen.getByTestId('message-bubble')).toHaveAttribute('data-side', 'requester');
    unmount();

    render(<MessageBubble message={makeAgentMessage()} fromRequester={false} />);
    expect(screen.getByTestId('message-bubble')).toHaveAttribute('data-side', 'attendance');
  });

  it('keeps the line breaks of the body and interprets no markup (BR2.1)', () => {
    const message = makeMessage({ body: 'Primeira linha.\n<b>segunda</b>' });
    render(<MessageBubble message={message} fromRequester />);

    const body = screen.getByTestId('message-bubble-body');
    expect(body).toHaveTextContent('<b>segunda</b>');
    expect(body.querySelector('b')).toBeNull();
    expect(body).toHaveClass('whitespace-pre-wrap');
  });

  it('offers no "ver mais" on a short message (BR5.4)', () => {
    render(<MessageBubble message={makeMessage({ body: 'Curta.' })} fromRequester />);

    expect(screen.queryByTestId('message-bubble-toggle-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('message-bubble-body')).not.toHaveClass('line-clamp-6');
  });

  it('folds a long message and unfolds it on "Ver mais" (BR5.4)', async () => {
    const user = userEvent.setup();
    render(<MessageBubble message={makeMessage({ body: LONG_BODY })} fromRequester />);

    const toggle = screen.getByTestId('message-bubble-toggle-button');
    expect(toggle).toHaveTextContent('Ver mais');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('message-bubble-body')).toHaveClass('line-clamp-6');

    await user.click(toggle);

    expect(toggle).toHaveTextContent('Ver menos');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('message-bubble-body')).not.toHaveClass('line-clamp-6');
  });

  it('folds a message with more lines than the limit, even when it is short (BR5.4)', () => {
    render(<MessageBubble message={makeMessage({ body: MANY_LINES })} fromRequester />);

    expect(screen.getByTestId('message-bubble-toggle-button')).toBeInTheDocument();
    expect(screen.getByTestId('message-bubble-body')).toHaveClass('line-clamp-6');
  });
});
