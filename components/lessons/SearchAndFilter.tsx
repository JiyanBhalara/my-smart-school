'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface SearchAndFilterProps {
  subjects: string[];
  currentSearch: string;
  currentSubject: string;
}

export default function SearchAndFilter({
  currentSearch,
}: SearchAndFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const updateURL = useCallback((search: string) => {
    const params = new URLSearchParams(searchParams);

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    const newURL = params.toString() ? `/lessons?${params.toString()}` : '/lessons';
    router.push(newURL, { scroll: false });
  }, [searchParams, router]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, updateURL]);

  const clearSearch = () => {
    setSearchTerm('');
    router.push('/lessons', { scroll: false });
  };

  return (
    <div className="relative">
      <label htmlFor="lesson-search" className="sr-only">
        Find a lesson
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite"
      />
      <input
        id="lesson-search"
        type="text"
        placeholder="Find a lesson by title, subject or tag"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-10 w-full rounded-[4px] border border-rule bg-sheet pl-9 pr-10 text-[15px] text-ink placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={clearSearch}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[2px] text-graphite transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
