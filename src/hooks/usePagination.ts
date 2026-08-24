import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;

export default function usePagination<T>(items: T[], initialPageSize: number = DEFAULT_PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to first page whenever the dataset or page size changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Changing page size should always bring the user back to page 1.
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  };

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  const absoluteIndex = (index: number) => (currentPage - 1) * pageSize + index;

  return { currentPage, setCurrentPage, pageItems, pageSize, setPageSize, totalPages, absoluteIndex };
}
