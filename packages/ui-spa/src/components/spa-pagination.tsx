import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@baron/ui/pagination';
import { PaginateQueryArguments } from '@baron/utils';
import {
  ArrowLeftToLineIcon,
  ArrowRightIcon,
  ArrowRightToLineIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import { Fragment, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

function LinkToPage(props: {
  children: ReactNode;
  page: number;
  isActive?: boolean;
  disabled?: boolean;
}) {
  const location = useLocation();
  const path = useMemo(() => {
    const search = new URLSearchParams(location.search);

    search.set('page', '' + props.page);

    return '?' + search.toString();
  }, [props.page, location.search]);

  return (
    <PaginationItem>
      {props.disabled ? (
        <PaginationLink
          href={path}
          isActive={props.isActive}
          Component={({ ref, ...props }) => (
            <span className="cursor-not-allowed">
              <span className="pointer-events-none">
                <a ref={ref} href="#" {...props} />
              </span>
            </span>
          )}
        >
          {props.children}
        </PaginationLink>
      ) : (
        <PaginationLink
          href={path}
          isActive={props.isActive}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Component={({ ref, ...props }) => (
            <NavLink to={props.href ?? '#'} {...props} />
          )}
        >
          {props.children}
        </PaginationLink>
      )}
    </PaginationItem>
  );
}

export function SpaPagination({
  count,
  nextPage,
  hasMore,
  limit,
}: {
  count: number;
  nextPage: PaginateQueryArguments | null;
  hasMore: boolean;
  limit: number;
}) {
  const { t } = useTranslation();
  const data = useMemo(() => {
    const totalPages = Math.ceil((count ?? 0) / (nextPage?.take ?? limit));
    const currentPage = hasMore
      ? Math.trunc((nextPage?.skip ?? limit) / (nextPage?.take ?? limit))
      : totalPages;

    if (totalPages <= 7) {
      return {
        pages: new Array(totalPages).fill(null).map((_, index) => index + 1),
        currentPage,
        totalPages,
      };
    }
    const pagesNumbers = [1];

    const possibleRange = new Array(7)
      .fill(null)
      .map((_, index) => {
        return index < 3
          ? currentPage - 3 + index
          : index === 3
            ? currentPage
            : currentPage - 3 + index;
      })
      .filter((i) => i < totalPages);

    possibleRange.forEach((r) => {
      if (pagesNumbers[pagesNumbers.length - 1]! < r) {
        pagesNumbers.push(r);
      }
    });

    pagesNumbers.push(totalPages);

    return {
      pages: pagesNumbers,
      currentPage,
      totalPages,
    };
  }, [count, hasMore, limit, nextPage?.skip, nextPage?.take]);

  return (
    <Pagination>
      <PaginationContent>
        <LinkToPage disabled={data.currentPage === 1} page={1}>
          <span className="sr-only">{t('Go to first page')}</span>
          <ArrowLeftToLineIcon className="w-4 h-4" />
        </LinkToPage>
        <LinkToPage
          disabled={data.currentPage === 1}
          page={data.currentPage - 1}
        >
          <span className="sr-only">{t('Go to first page')}</span>
          <ArrowLeftToLineIcon className="w-4 h-4" />
        </LinkToPage>
        {data.pages.map((page, index) => (
          <Fragment key={page}>
            {index === 1 && page > 2 && (
              <PaginationItem>
                <MoreHorizontalIcon className="w-6 mt-1" />
              </PaginationItem>
            )}
            <LinkToPage isActive={page === data.currentPage} page={page}>
              {page}
            </LinkToPage>

            {index === data.pages.length - 2 && page < data.totalPages - 1 && (
              <PaginationItem>
                <MoreHorizontalIcon className="w-6 mt-1" />
              </PaginationItem>
            )}
          </Fragment>
        ))}
        <LinkToPage
          disabled={data.currentPage === data.totalPages}
          page={data.currentPage + 1}
        >
          <span className="sr-only">{t('Next')}</span>
          <ArrowRightIcon className="w-4 h-4" />
        </LinkToPage>
        <LinkToPage
          disabled={data.currentPage === data.totalPages}
          page={data.totalPages}
        >
          <span className="sr-only">{t('Go to last page')}</span>
          <ArrowRightToLineIcon className="w-4 h-4" />
        </LinkToPage>
      </PaginationContent>
    </Pagination>
  );
}
