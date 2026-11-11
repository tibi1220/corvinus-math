import { Download } from 'lucide-react';
import {
  downloadLink,
  fileSize,
  type ExerciseDownloads as Downloads,
} from '@/lib/content';

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-sm hover:border-zinc-400 dark:hover:border-zinc-600';

// The plain PDFs of the exercises (a week's or the whole course's): without
// and with solutions.
export function ExerciseDownloads({ downloads }: { downloads: Downloads }) {
  const files = [
    { label: 'Exercises', file: downloads.exercises },
    { label: 'With solutions', file: downloads.solutions },
  ];
  return files.map(
    ({ label, file }) =>
      file && (
        <a
          key={label}
          {...downloadLink(file)}
          className={buttonClass}
        >
          <Download
            aria-hidden
            className='size-4'
          />
          {label}
          <span className='text-zinc-500 dark:text-zinc-400'>
            PDF, {fileSize(file.size)}
          </span>
        </a>
      ),
  );
}
