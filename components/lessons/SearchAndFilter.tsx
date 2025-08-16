'use client';

import { useState, useEffect } from 'react';
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const updateURL = (search: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    const newURL = params.toString() ? `/lessons?${params.toString()}` : '/lessons';
    router.push(newURL, { scroll: false });
  };

  const clearSearch = () => {
    setSearchTerm('');
    router.push('/lessons', { scroll: false });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className={`relative flex items-center transition-all duration-500 ${
          isSearchFocused ? 'transform scale-[1.02] shadow-2xl' : 'shadow-lg'
        }`}>
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
            <Search className={`h-5 w-5 transition-all duration-300 ${
              isSearchFocused ? 'text-indigo-600 scale-110' : 'text-gray-400'
            }`} />
          </div>
          <input
            type="text"
            placeholder="Search lessons, subjects, or discover new topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full pl-14 pr-14 py-4 lg:py-5 border-0 rounded-2xl text-gray-800 placeholder-gray-500 transition-all duration-500 focus:outline-none focus:ring-0 text-base lg:text-lg font-medium ${
              isSearchFocused 
                ? 'bg-gradient-to-r from-indigo-50 via-white to-purple-50 shadow-2xl ring-2 ring-indigo-200' 
                : 'bg-white shadow-lg hover:shadow-xl'
            } backdrop-blur-sm`}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-5 flex items-center hover:scale-110 transition-all duration-200 z-10"
            >
              <div className="p-1.5 rounded-full bg-gray-100 hover:bg-red-100 transition-colors duration-200">
                <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
              </div>
            </button>
          )}
        </div>
        
        {/* Search suggestions indicator */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-100">
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
              Try searching for specific topics, lesson names, or subjects
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
