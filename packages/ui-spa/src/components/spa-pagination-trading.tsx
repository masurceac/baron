import { useMemo } from 'react';
import { ChevronRight, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Trans } from 'react-i18next';
import { Button } from '@baron/ui/button';
import { cn } from '@baron/ui/utils';

const ITEMS_PER_PAGE = 10;

function getPageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
) {
  const pages: Array<number | string> = [];

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(1);

  const leftSibling = Math.max(currentPage - 2, 2);
  const rightSibling = Math.min(currentPage + 2, totalPages - 1);

  if (leftSibling > 2) {
    pages.push('...');
  }

  for (let page = leftSibling; page <= rightSibling; page++) {
    pages.push(page);
  }

  if (rightSibling < totalPages - 1) {
    pages.push('...');
  }

  pages.push(totalPages);

  return pages;
}

export const SpaPaginationTrading = ({
  page,
  total,
  limit = ITEMS_PER_PAGE,
  setPage,
  className,
}: {
  total: number;
  limit?: number;
  page: number;
  setPage(page: number): void;
  className?: string;
}) => {
  const { totalPages, currentPage } = useMemo(() => {
    const totalPages = Math.ceil(total / limit);
    return {
      totalPages,
      currentPage: page,
    };
  }, [total, limit, page]);

  const pagesToShow = useMemo(() => {
    return getPageRange(currentPage, totalPages, 7);
  }, [currentPage, totalPages]);

  return (
    <div className={cn('flex justify-between items-center', className)}>
      <div className="text-xs text-foreground-tertiary">
        <Trans
          i18nKey="Showing <bold>{{from}}-{{to}}</bold> of <bold>{{total}}</bold>"
          components={{
            bold: <span className="font-bold text-foreground" />,
          }}
          values={{
            from: (page - 1) * limit,
            to: page * limit,
            total,
          }}
        />
      </div>
      <nav className="flex gap-1 items-center">
        <div className="flex space-x-1">
          <Button
            variant="darkOutline"
            disabled={currentPage === 1}
            onClick={() => currentPage > 1 && setPage(currentPage - 1)}
            size="icon"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          {pagesToShow.map((p, index) => {
            if (p === '...') {
              return (
                <div key={`ellipsis-${index}`} className="px-2">
                  <MoreHorizontal className="size-4" />
                </div>
              );
            }

            const pageNumber = p as number;
            return (
              <Button
                key={pageNumber}
                title={`${pageNumber}`}
                onClick={() => setPage(pageNumber)}
                disabled={pageNumber === currentPage}
                variant="darkOutline"
                size="xs"
              >
                <span className="truncate">{pageNumber}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex space-x-1">
          <Button
            variant="darkOutline"
            onClick={() =>
              currentPage < totalPages ? setPage(currentPage + 1) : null
            }
            size="icon"
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>
    </div>
  );
};
