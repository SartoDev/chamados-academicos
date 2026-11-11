interface CountCardProps {
  label: string;
  count: number;
  testId: string;
}

/** One quantity of the panel, always with its label written out next to it (BR7.1, BR7.4). */
export function CountCard({ label, count, testId }: CountCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-md border p-4" data-testid={testId}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold" data-testid={`${testId}-value`}>
        {count}
      </span>
      <span className="text-xs text-muted-foreground">
        {count === 1 ? '1 chamado' : `${count} chamados`}
      </span>
    </div>
  );
}
