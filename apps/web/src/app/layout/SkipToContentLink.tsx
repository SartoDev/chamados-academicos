/** BR7.1: first focusable element of every page. */
export function SkipToContentLink() {
  return (
    <a
      href="#main-content"
      data-testid="skip-to-content-link"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
    >
      Pular para o conteúdo
    </a>
  );
}
