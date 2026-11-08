export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className='mb-8'>
      <h1 className='text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100'>
        {title}
      </h1>
      {subtitle && (
        <p className='mt-1 text-zinc-600 dark:text-zinc-400'>{subtitle}</p>
      )}
    </header>
  );
}
