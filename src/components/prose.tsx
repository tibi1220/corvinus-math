// Long-form text, such as the privacy policy.
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className='space-y-4 leading-relaxed text-zinc-700 dark:text-zinc-300 [&_a]:underline [&_a:hover]:text-zinc-900 dark:[&_a:hover]:text-zinc-100 [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_strong]:font-semibold [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6'>
      {children}
    </div>
  );
}
