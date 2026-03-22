import React from 'react';
import { Link } from '@inertiajs/react';

interface LinkProp {
  url: string | null;
  label: string;
  active: boolean;
}

interface Props {
  links: LinkProp[];
}

export default function Pagination({ links }: Props) {
  if (links.length <= 3) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 py-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800">
      {links.map((link, key) => (
        link.url === null ? (
          <div
            key={key}
            className="px-4 py-2 text-sm text-zinc-400 bg-transparent cursor-default select-none transition-colors border border-transparent"
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ) : (
          <Link
            key={key}
            href={link.url}
            className={`px-4 py-2 text-sm font-medium transition-all rounded-md border ${
              link.active
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-105'
                : 'text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        )
      ))}
    </div>
  );
}
