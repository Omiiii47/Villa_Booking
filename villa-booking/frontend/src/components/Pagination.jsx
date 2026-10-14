'use client'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const getPageNumbers = (page, pages) => {
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return nums;
};

const Pagination = ({ page, pages, total, limit, onPage }) => {
  if (!pages || pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-400">{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"
          className="h-8 w-8 rounded-lg bg-luxury-cream text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-luxury-cream flex items-center justify-center">
          <FaChevronLeft className="text-[10px]" />
        </button>
        {getPageNumbers(page, pages).map((n) => (
          <button key={n} onClick={() => onPage(n)}
            className={`h-8 min-w-8 px-2 rounded-lg text-xs ${
              n === page ? 'bg-luxury-accent text-white' : 'bg-luxury-cream text-gray-600 hover:bg-gray-200'
            }`}>
            {n}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page"
          className="h-8 w-8 rounded-lg bg-luxury-cream text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-luxury-cream flex items-center justify-center">
          <FaChevronRight className="text-[10px]" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
